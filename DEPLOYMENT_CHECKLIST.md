# 🚀 Production Deploy Checklist

## ✅ Pre-Deployment Checks

### 1. **Build Tests - PASSED** ✅
- ✅ Frontend build successful (TypeScript compilation)
- ✅ No TypeScript errors
- ✅ All `.js` files migrated to `.tsx`/`.ts`

### 2. **Code Changes Summary**
- ✅ TypeScript migration complete
- ✅ Payment link functionality added
- ✅ Tracking code functionality added
- ✅ Image upload (Cloudinary) fixed
- ✅ Chat image upload fixed
- ✅ Order model schema updated (paymentLink field added)

### 3. **Environment Variables Required**

#### **Backend (Render):**
```env
NODE_ENV=production
PORT=5000 (auto-set by Render)
MONGO_URI=mongodb+srv://... (your MongoDB connection string)
JWT_SECRET=<generate-new-secret> ⚠️
CLIENT_URL=https://agentbuy.mn,https://www.agentbuy.mn,https://agentbuy.vercel.app
CLOUDINARY_CLOUD_NAME=dn5fzzxis
CLOUDINARY_API_KEY=731682522556299
CLOUDINARY_API_SECRET=01gBrlS1wtexb-uQd4UGFx7l0Jo
CLOUDINARY_FOLDER=agentbuy
CLOUDINARY_UPLOAD_PRESET=<optional>
```

#### **Frontend (Vercel):**
```env
NEXT_PUBLIC_API_URL=https://agentbuy-backend.onrender.com ⚠️
NEXT_PUBLIC_SOCKET_URL=https://agentbuy-backend.onrender.com ⚠️
```

### 4. **Deployment Configuration**

#### **Vercel Settings:**
- ✅ Root Directory: `frontend` (must be set in Vercel Dashboard)
- ✅ Build Command: `npm run build` (auto)
- ✅ Output Directory: `.next` (auto)
- ✅ Framework: Next.js (auto-detected)

#### **Render Settings:**
- ✅ Root Directory: `backend`
- ✅ Build Command: `npm install`
- ✅ Start Command: `npm start`

### 5. **Database Schema Changes** ⚠️

**New Field Added:**
- `order.report.paymentLink` (String) - Added to `backend/src/models/orderModel.js`

**Migration Note:**
- MongoDB schema is flexible, no migration needed
- Existing orders without `paymentLink` will have `undefined`
- Code handles missing `paymentLink` gracefully

### 6. **Potential Issues & Solutions**

#### ⚠️ Issue 1: Missing paymentLink in old orders
- **Status:** ✅ Handled
- **Solution:** Code checks `order.report?.paymentLink` before display
- **Impact:** Low - only affects old orders

#### ⚠️ Issue 2: JWT_SECRET not set
- **Status:** ⚠️ Action Required
- **Solution:** Generate new secret:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
- **Impact:** Critical - authentication will fail

#### ⚠️ Issue 3: CORS Configuration
- **Status:** ✅ Configured
- **Solution:** `CLIENT_URL` environment variable includes production domains
- **Impact:** None if configured correctly

#### ⚠️ Issue 4: Cloudinary Configuration
- **Status:** ✅ Configured
- **Solution:** All Cloudinary env vars are set
- **Impact:** Low - image uploads will work

### 7. **Git Commit Checklist**

Before pushing to GitHub:

```bash
# 1. Stage all changes
git add .

# 2. Commit with descriptive message
git commit -m "feat: TypeScript migration, payment link, tracking code, image upload fixes"

# 3. Verify no sensitive data
git diff --cached | grep -i "password\|secret\|key" || echo "✅ No secrets found"

# 4. Push to GitHub
git push origin main
```

### 8. **Post-Deployment Verification**

After deployment, verify:

#### Backend (Render):
- [ ] Service shows "Live" status
- [ ] Health check: `https://agentbuy-backend.onrender.com/api/health` (if exists)
- [ ] Test API endpoint: `https://agentbuy-backend.onrender.com/api/admin/orders`

#### Frontend (Vercel):
- [ ] Build successful (green status)
- [ ] Site loads: `https://agentbuy.vercel.app`
- [ ] Login works
- [ ] API calls work (check browser console)
- [ ] Images upload to Cloudinary
- [ ] Payment links display correctly
- [ ] Tracking codes work

### 9. **Rollback Plan**

If deployment fails:

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or rollback to specific commit
git reset --hard <previous-commit-hash>
git push origin main --force
```

### 10. **Important Notes**

1. **Backend must be deployed FIRST** - Frontend depends on backend URL
2. **Update Vercel env vars** after backend URL is known
3. **Test payment link flow** after deployment
4. **Monitor error logs** on both Render and Vercel
5. **Database schema is flexible** - no migration scripts needed

---

## 🚀 Deployment Steps

1. ✅ **Verify Build** (already done)
2. ⏳ **Commit & Push to GitHub**
3. ⏳ **Deploy Backend (Render)**
4. ⏳ **Set Backend URL in Vercel env vars**
5. ⏳ **Deploy Frontend (Vercel)**
6. ⏳ **Verify Production**

---

**Last Updated:** $(date)
**Status:** Ready for deployment ✅

