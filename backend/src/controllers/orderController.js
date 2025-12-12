const { prisma } = require("../config/db");
const { assertTransition, ORDER_STATUS } = require("../services/orderStateService");
const { consumeOnPublish, returnOnCancel, completeBonus } = require("../services/cardService");
const { getIO } = require("../socket");
const { normalizeItemImages, uploadImages } = require("../services/cloudinaryService");

const ERR_NOT_FOUND = { message: "Захиалга олдсонгүй" };

async function createDraft(req, res) {
  try {
    const { items = [], cargoId, isPackage = false, userNote } = req.body;
    if (!items.length) {
      return res.status(400).json({ message: "Дор хаяж 1 бараа оруулна уу" });
    }
    if (!cargoId) {
      return res.status(400).json({ message: "Карго сонгоно уу" });
    }
    const cargo = await prisma.cargo.findUnique({ where: { id: cargoId } });
    if (!cargo) {
      return res.status(400).json({ message: "Карго олдсонгүй" });
    }

    // Cloudinary-д зураг upload хийх (base64 string-уудыг URL болгох)
    const normalizedItems = await normalizeItemImages(items);
    // normalizeItemImages алдаа гарвал null эсвэл алдаа throw хийх
    // Энэ нь зөвхөн Cloudinary URL-уудыг буцаана, base64 string-уудыг filter хийж байна

    const userId = req.user.id || req.user._id;
    const order = await prisma.order.create({
      data: {
        userId,
        cargoId,
        isPackage,
        userNote,
        status: ORDER_STATUS.DRAFT,
        items: {
          create: normalizedItems.map(item => ({
            title: item.title,
            imageUrl: item.imageUrl,
            images: item.images || [],
            sourceUrl: item.sourceUrl,
            quantity: item.quantity || 1,
            userNotes: item.userNotes,
            agentPrice: item.agentPrice,
            agentCurrency: item.agentCurrency || "CNY",
            agentTotal: item.agentTotal,
            packageIndex: item.packageIndex,
            trackingCode: item.trackingCode,
          })),
        },
      },
      include: {
        items: true,
        cargo: true,
      },
    });

    res.status(201).json(order);
  } catch (err) {
    console.error("createDraft error", err);
    res.status(500).json({ message: "Серверийн алдаа" });
  }
}

async function publishOrder(req, res) {
  try {
    const userId = req.user.id || req.user._id;
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId },
      include: { items: true },
    });
    if (!order) return res.status(404).json(ERR_NOT_FOUND);

    assertTransition(order.status, ORDER_STATUS.PUBLISHED, "user");

    await consumeOnPublish(req.user, order.id, order);
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { status: ORDER_STATUS.PUBLISHED },
      include: { items: true, cargo: true },
    });

    try {
      getIO().emit("order:new", { orderId: order.id, status: updatedOrder.status });
    } catch (e) {}

    res.json(updatedOrder);
  } catch (err) {
    console.error("publishOrder error", err);
    res.status(err.statusCode || 500).json({ message: err.message || "Серверийн алдаа" });
  }
}

async function listUserOrders(req, res) {
  const { status, limit = 50 } = req.query;
  const userId = req.user.id || req.user._id;
  const where = { userId };
  if (status) where.status = status;
  
  const orders = await prisma.order.findMany({
    where,
    include: {
      cargo: { select: { id: true, name: true } },
      items: true,
    },
    orderBy: { createdAt: "desc" },
    take: Number(limit),
  });
  
  // Base64 string-уудыг filter хийх (зөвхөн Cloudinary URL-уудыг буцаах)
  const filteredOrders = orders.map(order => {
    const filteredItems = (order.items || []).map(item => {
      // images array байвал filter хийх
      if (item.images && Array.isArray(item.images)) {
        // Base64 string-уудыг filter хийх (зөвхөн Cloudinary URL-уудыг үлдээх)
        const filteredImages = item.images.filter(img => 
          img && 
          typeof img === "string" && 
          img.trim() !== "" &&
          !img.startsWith("data:") &&
          (img.startsWith("http://") || img.startsWith("https://"))
        );
        return { ...item, images: filteredImages };
      }
      
      // images байхгүй эсвэл array биш бол imageUrl шалгах
      if (!item.images && item.imageUrl) {
        // imageUrl нь Cloudinary URL эсэх шалгах
        if (item.imageUrl && 
            typeof item.imageUrl === "string" && 
            !item.imageUrl.startsWith("data:") &&
            (item.imageUrl.startsWith("http://") || item.imageUrl.startsWith("https://"))) {
          // imageUrl-ийг images array болгох
          return { ...item, images: [item.imageUrl] };
        }
      }
      
      // images байхгүй бол хоосон array буцаах (undefined биш)
      return { ...item, images: item.images || [] };
    });
    return { ...order, items: filteredItems };
  });
  
  res.json(filteredOrders);
}

async function getOrderDetail(req, res) {
  const userId = req.user.id || req.user._id;
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, userId },
    include: {
      cargo: true,
      items: true,
      lock: true,
      pricing: true,
      payment: true,
      tracking: true,
      report: {
        include: {
          items: true,
          pricing: true,
        },
      },
      comments: {
        include: {
          sender: {
            select: { id: true, fullName: true, avatarUrl: true },
          },
        },
      },
      ratings: true,
    },
  });
  if (!order) return res.status(404).json(ERR_NOT_FOUND);
  res.json(order);
}

async function cancelBeforeAgent(req, res) {
  try {
    const userId = req.user.id || req.user._id;
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId },
      include: { lock: true },
    });
    if (!order) return res.status(404).json(ERR_NOT_FOUND);

    if (order.lock?.lockedByAgentId) {
      return res.status(400).json({ message: "Агент түгжсэн учраас цуцлах боломжгүй" });
    }
    assertTransition(order.status, ORDER_STATUS.CANCELLED_BY_USER, "user");

    await returnOnCancel(req.user, order.id);
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { status: ORDER_STATUS.CANCELLED_BY_USER },
      include: { cargo: true, items: true },
    });

    try {
      getIO().emit("order:update", { 
        orderId: order.id,
        status: updatedOrder.status,
        order: updatedOrder,
      });
    } catch (e) {}

    res.json(updatedOrder);
  } catch (err) {
    console.error("cancelBeforeAgent error", err);
    res.status(err.statusCode || 500).json({ message: err.message || "Серверийн алдаа" });
  }
}

async function cancelAfterReport(req, res) {
  try {
    const userId = req.user.id || req.user._id;
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId },
    });
    if (!order) return res.status(404).json(ERR_NOT_FOUND);
    assertTransition(order.status, ORDER_STATUS.USER_REJECTED, "user");

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { status: ORDER_STATUS.USER_REJECTED },
    });

    try {
      getIO().emit("order:update", { orderId: order.id, status: updatedOrder.status });
    } catch (e) {}
    res.json(updatedOrder);
  } catch (err) {
    console.error("cancelAfterReport error", err);
    res.status(err.statusCode || 500).json({ message: err.message || "Серверийн алдаа" });
  }
}

async function acceptReport(req, res) {
  try {
    const userId = req.user.id || req.user._id;
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId },
      include: { payment: true },
    });
    if (!order) return res.status(404).json(ERR_NOT_FOUND);
    assertTransition(order.status, ORDER_STATUS.WAITING_PAYMENT, "user");

    const deadline = order.payment?.deadline || new Date(Date.now() + 1000 * 60 * 60 * 24);
    
    // Payment-ийг тусад нь upsert хийх
    if (order.payment) {
      await prisma.orderPayment.update({
        where: { orderId: order.id },
        data: { deadline },
      });
    } else {
      await prisma.orderPayment.create({
        data: {
          orderId: order.id,
          deadline,
        },
      });
    }
    
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { status: ORDER_STATUS.WAITING_PAYMENT },
      include: { payment: true },
    });

    try {
      getIO().emit("order:update", { orderId: order.id, status: updatedOrder.status });
    } catch (e) {}

    res.json(updatedOrder);
  } catch (err) {
    console.error("acceptReport error", err);
    res.status(err.statusCode || 500).json({ message: err.message || "Серверийн алдаа" });
  }
}

async function confirmCompleted(req, res) {
  try {
    const userId = req.user.id || req.user._id;
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId },
    });
    if (!order) return res.status(404).json(ERR_NOT_FOUND);
    assertTransition(order.status, ORDER_STATUS.COMPLETED, "user");

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { status: ORDER_STATUS.COMPLETED },
    });
    await completeBonus(req.user, order.id);

    try {
      getIO().emit("order:update", { orderId: order.id, status: updatedOrder.status });
    } catch (e) {}

    res.json(updatedOrder);
  } catch (err) {
    console.error("confirmCompleted error", err);
    res.status(err.statusCode || 500).json({ message: err.message || "Серверийн алдаа" });
  }
}

async function addComment(req, res) {
  try {
    const userId = req.user.id || req.user._id;
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId },
    });
    if (!order) return res.status(404).json(ERR_NOT_FOUND);

    const { message = "", attachments = [] } = req.body;
    const hasMessage = message && message.trim();
    const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
    
    if (!hasMessage && !hasAttachments) {
      return res.status(400).json({ message: "Мессеж эсвэл зураг заавал оруулах ёстой" });
    }

    // Зурагнуудыг Cloudinary-д upload хийх
    let uploadedAttachments = [];
    if (hasAttachments) {
      try {
        uploadedAttachments = await uploadImages(attachments, { folder: "agentbuy/chat" });
      } catch (uploadErr) {
        console.error("Chat image upload error:", uploadErr);
        // Upload алдаа гарвал зөвхөн текст илгээх
      }
    }

    const comment = await prisma.orderComment.create({
      data: {
        orderId: order.id,
        senderId: userId,
        senderRole: "user",
        message: hasMessage ? message.trim() : "",
        attachments: uploadedAttachments,
      },
      include: {
        sender: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
      },
    });

    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: { comments: { include: { sender: { select: { id: true, fullName: true, avatarUrl: true } } } } },
    });

    try {
      getIO().emit("order:comment", { orderId: order.id, role: "user" });
    } catch (e) {}

    res.json(updatedOrder);
  } catch (err) {
    console.error("addComment error", err);
    res.status(500).json({ message: "Серверийн алдаа" });
  }
}

async function updateOrderName(req, res) {
  try {
    const userId = req.user.id || req.user._id;
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId },
    });
    if (!order) return res.status(404).json(ERR_NOT_FOUND);

    const { customName } = req.body;
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { customName: customName ? customName.trim() : null },
      include: { items: true, cargo: true },
    });

    try {
      getIO().emit("order:update", { orderId: order.id, order: updatedOrder });
    } catch (e) {}

    res.json(updatedOrder);
  } catch (err) {
    console.error("updateOrderName error", err);
    res.status(500).json({ message: "Серверийн алдаа" });
  }
}

async function updateDraft(req, res) {
  try {
    const userId = req.user.id || req.user._id;
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId },
      include: { items: true },
    });
    if (!order) return res.status(404).json(ERR_NOT_FOUND);

    // Зөвхөн ноорог захиалгыг засах боломжтой
    if (order.status !== ORDER_STATUS.DRAFT) {
      return res.status(400).json({ message: "Зөвхөн ноорог захиалгыг засах боломжтой" });
    }

    const { items, cargoId, userNote } = req.body;
    const updateData = {};
    
    if (items && Array.isArray(items) && items.length > 0) {
      try {
        // Cloudinary-д зураг upload хийх (зөвхөн Cloudinary URL-уудыг хадгалах)
        const normalizedItems = await normalizeItemImages(items, { folder: "agentbuy/orders" });
        
        // Хуучин items-ийг устгах
        await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
        
        // Шинэ items үүсгэх
        await prisma.orderItem.createMany({
          data: normalizedItems.map(item => ({
            orderId: order.id,
            title: item.title,
            imageUrl: item.imageUrl,
            images: item.images || [],
            sourceUrl: item.sourceUrl,
            quantity: item.quantity || 1,
            userNotes: item.userNotes,
            agentPrice: item.agentPrice,
            agentCurrency: item.agentCurrency || "CNY",
            agentTotal: item.agentTotal,
            packageIndex: item.packageIndex,
            trackingCode: item.trackingCode,
          })),
        });
      } catch (uploadErr) {
        console.error("updateDraft: normalizeItemImages error", uploadErr);
        // Зураг upload хийхэд алдаа гарвал items-ийг шууд хадгалах (base64-г хадгалахгүй)
        // Гэхдээ base64-г filter хийх
        const filteredItems = items.map(item => {
          const filtered = { ...item };
          if (Array.isArray(filtered.images)) {
            filtered.images = filtered.images.filter(img => 
              img && 
              typeof img === "string" && 
              img.trim() !== "" &&
              !img.startsWith("data:") &&
              (img.startsWith("http://") || img.startsWith("https://"))
            );
          }
          if (filtered.imageUrl && typeof filtered.imageUrl === "string" && filtered.imageUrl.startsWith("data:")) {
            delete filtered.imageUrl;
          }
          return filtered;
        });
        
        // Хуучин items-ийг устгах
        await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
        
        // Шинэ items үүсгэх
        await prisma.orderItem.createMany({
          data: filteredItems.map(item => ({
            orderId: order.id,
            title: item.title,
            imageUrl: item.imageUrl,
            images: item.images || [],
            sourceUrl: item.sourceUrl,
            quantity: item.quantity || 1,
            userNotes: item.userNotes,
            agentPrice: item.agentPrice,
            agentCurrency: item.agentCurrency || "CNY",
            agentTotal: item.agentTotal,
            packageIndex: item.packageIndex,
            trackingCode: item.trackingCode,
          })),
        });
      }
    }

    if (cargoId) {
      const cargo = await prisma.cargo.findUnique({ where: { id: cargoId } });
      if (!cargo) {
        return res.status(400).json({ message: "Карго олдсонгүй" });
      }
      updateData.cargoId = cargoId;
    }

    if (userNote !== undefined) {
      updateData.userNote = userNote ? userNote.trim() : null;
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: updateData,
      include: { items: true, cargo: true },
    });

    try {
      getIO().emit("order:update", { orderId: order.id, order: updatedOrder });
    } catch (e) {}

    res.json(updatedOrder);
  } catch (err) {
    console.error("updateDraft error", err);
    res.status(500).json({ message: err.message || "Серверийн алдаа" });
  }
}

async function deleteOrder(req, res) {
  try {
    const userId = req.user.id || req.user._id;
    console.log("[Delete] Received delete request for order:", req.params.id, "from user:", userId);
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId },
    });
    if (!order) {
      console.log("[Delete] Order not found:", req.params.id);
      return res.status(404).json(ERR_NOT_FOUND);
    }

    console.log("[Delete] Order found, status:", order.status);

    // Зөвхөн цуцлагдсан статустай захиалгуудыг устгах боломжтой (PUBLISHED-ийг цуцлаад дараа нь устгана)
    const deletableStatuses = [
      ORDER_STATUS.CANCELLED_BY_USER,
      ORDER_STATUS.CANCELLED_BY_ADMIN,
      ORDER_STATUS.CANCELLED_NO_AGENT,
      ORDER_STATUS.USER_REJECTED,
      ORDER_STATUS.PAYMENT_EXPIRED,
    ];

    if (!deletableStatuses.includes(order.status)) {
      console.log("[Delete] Status not deletable:", order.status);
      return res.status(400).json({
        message: `Энэ захиалгыг устгах боломжгүй. Зөвхөн нээлттэй эсвэл цуцлагдсан захиалгуудыг устгах боломжтой.`,
      });
    }

    // Захиалгыг database-аас бүрэн устгах (cascade delete ашиглана)
    console.log("[Delete] Deleting order from database...");
    await prisma.order.delete({ where: { id: order.id } });
    console.log("[Delete] Order deleted successfully");

    try {
      getIO().emit("order:delete", { orderId: order.id });
      console.log("[Delete] Socket event emitted");
    } catch (e) {
      console.error("Socket emit error:", e);
    }

    res.status(204).send();
  } catch (err) {
    console.error("deleteOrder error", err);
    res.status(500).json({ message: "Серверийн алдаа" });
  }
}

module.exports = {
  createDraft,
  publishOrder,
  listUserOrders,
  getOrderDetail,
  cancelBeforeAgent,
  cancelAfterReport,
  acceptReport,
  confirmCompleted,
  addComment,
  updateOrderName,
  updateDraft,
  deleteOrder,
};
