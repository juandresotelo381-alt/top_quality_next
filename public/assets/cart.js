// Gestor del Carrito de Compras en LocalStorage
const TQCart = {
    get() {
        return JSON.parse(localStorage.getItem('tq_cart') || '[]');
    },
    save(cart) {
        localStorage.setItem('tq_cart', JSON.stringify(cart));
        this.updateBadge();
    },
    add(item) {
        let cart = this.get();
        let index = cart.findIndex(i => i.variantId === item.variantId);
        if (index > -1) {
            cart[index].quantity += item.quantity;
            if (cart[index].quantity > item.maxStock) {
                cart[index].quantity = item.maxStock;
            }
        } else {
            cart.push(item);
        }
        this.save(cart);
        this.openDrawer();
    },
    remove(index) {
        let cart = this.get();
        cart.splice(index, 1);
        this.save(cart);
        this.renderDrawer();
    },
    updateQuantity(index, qty) {
        let cart = this.get();
        if (cart[index]) {
            cart[index].quantity = Math.max(1, Math.min(qty, cart[index].maxStock));
            this.save(cart);
            this.renderDrawer();
        }
    },
    count() {
        return this.get().reduce((sum, item) => sum + item.quantity, 0);
    },
    total() {
        return this.get().reduce((sum, item) => sum + (item.price * item.quantity), 0);
    },
    clear() {
        localStorage.removeItem('tq_cart');
        this.updateBadge();
        this.renderDrawer();
    },
    updateBadge() {
        const badges = document.querySelectorAll('.cart-badge-count');
        const count = this.count();
        badges.forEach(b => {
            b.textContent = count;
            b.style.display = count > 0 ? 'inline-flex' : 'none';
        });
    },
    openDrawer() {
        const drawer = document.getElementById('cart-drawer');
        const overlay = document.getElementById('cart-overlay');
        if (drawer && overlay) {
            drawer.classList.add('open');
            overlay.classList.add('open');
            this.renderDrawer();
        }
    },
    closeDrawer() {
        const drawer = document.getElementById('cart-drawer');
        const overlay = document.getElementById('cart-overlay');
        if (drawer && overlay) {
            drawer.classList.remove('open');
            overlay.classList.remove('open');
        }
    },
    renderDrawer() {
        const itemsContainer = document.getElementById('cart-drawer-items');
        const totalContainer = document.getElementById('cart-drawer-total');
        if (!itemsContainer || !totalContainer) return;

        const cart = this.get();
        itemsContainer.innerHTML = '';

        if (cart.length === 0) {
            itemsContainer.innerHTML = '<p class="empty-cart-msg" style="text-align:center; color:#888; margin-top:20px;">Tu carrito está vacío.</p>';
            totalContainer.textContent = '\$0 COP';
            return;
        }

        cart.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'cart-item-row';
            div.innerHTML = `
                <img src="${item.photo}" alt="${item.name}">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <small>Talla: ${item.size} | Color: ${item.color}</small>
                    <b>$${Number(item.price).toLocaleString('es-CO')} COP</b>
                    <div class="cart-qty-ctrl">
                        <button onclick="TQCart.updateQuantity(${index}, ${item.quantity - 1})">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="TQCart.updateQuantity(${index}, ${item.quantity + 1})">+</button>
                    </div>
                </div>
                <button class="btn-remove-item" onclick="TQCart.remove(${index})">✕</button>
            `;
            itemsContainer.appendChild(div);
        });

        totalContainer.textContent = '\$' + this.total().toLocaleString('es-CO') + ' COP';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    TQCart.updateBadge();
});