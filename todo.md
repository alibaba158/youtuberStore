# חנות יוטיובר - Project TODO

## Database & Backend
- [x] Define schema: categories, products, cart_items tables
- [x] Run migration and apply SQL
- [x] tRPC router: categories (list, create, update, delete)
- [x] tRPC router: products (list, getById, getByCategory, create, update, delete)
- [x] tRPC router: inventory (updateStock, getStock)
- [x] tRPC router: cart (getCart, addItem, removeItem, updateQuantity, clearCart)
- [x] Admin-only procedures with role guard

## Frontend - Core Layout
- [x] Global RTL (dir="rtl") setup in HTML and CSS
- [x] Hebrew font (Heebo or Assistant) via Google Fonts
- [x] Design tokens: color palette, typography, spacing
- [x] Top navigation bar with logo, categories, cart icon, login/user menu
- [x] Footer component
- [x] Responsive mobile menu (hamburger)

## Frontend - Pages
- [x] Homepage: hero banner, featured categories, featured products
- [x] Category listing page (/category/:slug)
- [x] Product detail page (/product/:id)
- [x] Cart page (/cart)
- [x] Login / auth page (via Manus OAuth)

## Frontend - Admin Panel
- [x] Admin layout with tabs navigation
- [x] Admin: product list with edit/delete actions
- [x] Admin: add/edit product form (name, description, price, category, image URL, stock)
- [x] Admin: stock management (quick update stock quantity)
- [x] Admin: category management (add/edit/delete categories)

## UI/UX Polish
- [x] Smooth page transitions and micro-animations (framer-motion)
- [x] Loading skeletons for product grids
- [x] Empty state illustrations
- [x] Toast notifications for cart actions
- [x] Stock badge (in stock / low stock / out of stock)
- [x] Responsive design: mobile-first breakpoints
- [x] RTL-correct icons and layout (arrows, chevrons)

## Testing
- [x] Vitest: product router tests
- [x] Vitest: cart router tests
- [x] Vitest: admin guard tests
