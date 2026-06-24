window.showToast=function(t,e="info",a=""){let o=document.querySelector(".toast-container");o||(o=document.createElement("div"),o.className="toast-container",document.body.appendChild(o));const n={success:"✅",error:"❌",warning:"⚠️",info:"ℹ️"},s={success:"Success",error:"Error",warning:"Warning",info:"Info"},r=document.createElement("div");r.className=`toast ${e}`,r.innerHTML=`
    <span class="toast-icon">${n[e]||"ℹ️"}</span>
    <div class="toast-content">
      <div class="toast-title">${a||s[e]}</div>
      <div class="toast-message">${t}</div>
    </div>
  `,o.appendChild(r),setTimeout(()=>{r.style.opacity="0",r.style.transform="translateX(20px)",r.style.transition="all 0.3s ease",setTimeout(()=>r.remove(),300)},4e3)};window.Auth={getToken:()=>localStorage.getItem("mm_token"),getUser:()=>{try{return JSON.parse(localStorage.getItem("mm_user"))}catch{return null}},setSession:(t,e)=>{localStorage.setItem("mm_token",t),localStorage.setItem("mm_user",JSON.stringify(e))},clearSession:()=>{localStorage.removeItem("mm_token"),localStorage.removeItem("mm_user")},isLoggedIn:()=>!!localStorage.getItem("mm_token"),isAdmin:()=>{const t=window.Auth.getUser();return t&&t.role==="admin"},authHeaders:()=>{const t=window.Auth.getToken();return t?{Authorization:`Bearer ${t}`}:{}}};$(document).ready(function(){g(),$("#login-form").length&&$("#login-form").validate({rules:{email:{required:!0,email:!0},password:{required:!0,minlength:6}},messages:{email:{required:"Email is required",email:"Enter a valid email"},password:{required:"Password is required",minlength:"At least 6 characters"}},submitHandler:function(t){const e=$("#login-btn"),a=e.html();e.prop("disabled",!0).html('<span class="spinner" style="width:18px;height:18px;border-width:2px;margin:0"></span>'),$.ajax({url:"/api/auth/login",method:"POST",contentType:"application/json",data:JSON.stringify({email:$("#login-email").val().trim(),password:$("#login-password").val()}),success:function(o){window.Auth.setSession(o.token,o.user),showToast("Welcome back, "+o.user.name+"! 🤘","success");const n=new URLSearchParams(window.location.search).get("redirect")||"/";setTimeout(()=>{window.location.href=o.user.role==="admin"?"/admin/dashboard":n},800)},error:function(o){const n=o.responseJSON?o.responseJSON.error:"Login failed";showToast(n,"error"),e.prop("disabled",!1).html(a)}})}}),$("#register-form").length&&$("#register-form").validate({rules:{name:{required:!0,minlength:2},email:{required:!0,email:!0},password:{required:!0,minlength:6},confirm_password:{required:!0,equalTo:"#reg-password"}},messages:{name:{required:"Name is required"},email:{required:"Email is required",email:"Enter a valid email"},password:{required:"Password is required",minlength:"At least 6 characters"},confirm_password:{required:"Please confirm password",equalTo:"Passwords do not match"}},submitHandler:function(){const t=$("#register-btn");t.prop("disabled",!0).html('<span class="spinner" style="width:18px;height:18px;border-width:2px;margin:0"></span>'),$.ajax({url:"/api/auth/register",method:"POST",contentType:"application/json",data:JSON.stringify({name:$("#reg-name").val().trim(),email:$("#reg-email").val().trim(),password:$("#reg-password").val()}),success:function(){showToast("Account created! Please log in. 🎸","success"),setTimeout(()=>window.location.href="/login",1200)},error:function(e){const a=e.responseJSON?e.responseJSON.error:"Registration failed";showToast(a,"error"),t.prop("disabled",!1).html("Create Account")}})}}),$(document).on("click","#logout-btn",function(){$.ajax({url:"/api/auth/logout",method:"POST",headers:window.Auth.authHeaders(),complete:function(){window.Auth.clearSession(),window.Cart.clear(),showToast("Logged out. See you in the pit! 🤘","info"),setTimeout(()=>window.location.href="/",800)}})})});function g(){const t=window.Auth.getUser(),e=$("#navbar-user-area");e.length&&(t&&window.Auth.isLoggedIn()?e.html(`
      <span style="font-size:13px;color:var(--text-secondary);">${t.name}</span>
      ${t.role==="admin"?'<a href="/admin/dashboard" class="btn btn-secondary btn-sm">Admin</a>':'<a href="/orders" class="btn btn-secondary btn-sm">Orders</a>'}
      <button id="logout-btn" class="btn btn-outline btn-sm">Logout</button>
    `):e.html(`
      <a href="/login" class="btn btn-ghost btn-sm">Login</a>
      <a href="/register" class="btn btn-primary btn-sm">Join Now</a>
    `))}window.updateNavbarUser=g;window.Cart={STORAGE_KEY:"mm_cart",get:function(){try{return JSON.parse(localStorage.getItem(this.STORAGE_KEY))||[]}catch{return[]}},save:function(t){localStorage.setItem(this.STORAGE_KEY,JSON.stringify(t)),this.updateBadge(),this.renderDrawer()},add:function(t,e=1){const a=this.get(),o=a.find(n=>n.id===t.id);o?o.quantity=Math.min(o.quantity+e,99):a.push({id:t.id,name:t.name,price:parseFloat(t.price),image:t.images&&t.images.length?t.images[0].image_path:null,quantity:e}),this.save(a),window.showToast(`"${t.name}" added to cart 🛒`,"success")},remove:function(t){const e=this.get().filter(a=>a.id!==t);this.save(e)},updateQty:function(t,e){const a=this.get(),o=a.find(n=>n.id===t);if(o){if(e<=0)return this.remove(t);o.quantity=Math.min(e,99)}this.save(a)},clear:function(){localStorage.removeItem(this.STORAGE_KEY),this.updateBadge(),this.renderDrawer()},total:function(){return this.get().reduce((t,e)=>t+e.price*e.quantity,0)},count:function(){return this.get().reduce((t,e)=>t+e.quantity,0)},updateBadge:function(){const t=this.count();$(".cart-badge").text(t).toggle(t>0)},renderDrawer:function(){const t=this.get(),e=$("#cart-drawer-body");if(!e.length)return;if(t.length===0){e.html(`
        <div class="cart-empty">
          <span class="cart-empty-icon">🛒</span>
          <p>Your cart is empty</p>
          <p style="font-size:13px;color:var(--text-muted)">Add some merch to get started!</p>
        </div>
      `),$("#cart-total-value").text("$0.00");return}let a="";for(const o of t){const n=o.image?o.image:"",s=n?`<img class="cart-item-image" src="${n}" alt="${o.name}" onerror="this.style.display='none'">`:'<div class="cart-item-image" style="background:var(--bg-tertiary);display:flex;align-items:center;justify-content:center;font-size:24px;border-radius:6px;">🎸</div>';a+=`
        <div class="cart-item" data-id="${o.id}">
          ${s}
          <div class="cart-item-details">
            <div class="cart-item-name">${o.name}</div>
            <div class="cart-item-price">$${(o.price*o.quantity).toFixed(2)}</div>
            <div class="cart-qty-control">
              <button class="cart-qty-btn" data-action="dec" data-id="${o.id}">−</button>
              <span class="cart-qty-value">${o.quantity}</span>
              <button class="cart-qty-btn" data-action="inc" data-id="${o.id}">+</button>
            </div>
          </div>
          <button class="cart-remove-btn" data-id="${o.id}" title="Remove">✕</button>
        </div>
      `}e.html(a),$("#cart-total-value").text(`$${this.total().toFixed(2)}`)},open:function(){$("#cart-overlay, #cart-drawer").addClass("open"),$("body").css("overflow","hidden"),this.renderDrawer()},close:function(){$("#cart-overlay, #cart-drawer").removeClass("open"),$("body").css("overflow","")}};let c=1,l="",h=1,u=!1,p=!1;function d(t=1,e=!1){if(p)return;p=!0;const a=l?`/api/products/search?q=${encodeURIComponent(l)}&page=${t}&limit=12`:`/api/products?page=${t}&limit=12`;e||($("#product-grid").html(`
      <div style="grid-column:1/-1;text-align:center;padding:60px 0">
        <div class="spinner"></div>
        <p style="color:var(--text-muted);margin-top:16px">Loading merch...</p>
      </div>
    `),$("#pagination").html("")),$.get(a,function(o){const{products:n,pagination:s}=o;if(h=s.pages,c=s.page,n.length===0&&!e){$("#product-grid").html(`
        <div style="grid-column:1/-1;text-align:center;padding:80px 0">
          <div style="font-size:56px;margin-bottom:16px">🎸</div>
          <h3 style="color:var(--text-secondary)">No products found</h3>
          <p style="color:var(--text-muted)">Try a different search term</p>
        </div>
      `);return}let r="";for(const i of n){const m=i.images&&i.images.length?`<img class="product-card-image" src="${i.images[0].image_path}" alt="${i.name}" loading="lazy" onerror="this.parentElement.innerHTML='<div class='product-card-image-placeholder'>🎸</div>'">`:'<div class="product-card-image-placeholder">🎸</div>',f=i.stock>10?'<span class="badge badge-success">In Stock</span>':i.stock>0?'<span class="badge badge-warning">Low Stock</span>':'<span class="badge badge-danger">Sold Out</span>';r+=`
        <div class="product-card" data-id="${i.id}">
          <div class="product-card-image-wrap">
            ${m}
            <div class="product-card-overlay">
              <button class="btn btn-primary btn-sm w-full quick-view-btn" data-id="${i.id}" ${i.stock===0?"disabled":""}>
                Quick View
              </button>
            </div>
          </div>
          <div class="product-card-body">
            <div class="product-card-name">${i.name}</div>
            <div class="product-card-price">$${parseFloat(i.price).toFixed(2)}</div>
            <div style="margin-top:6px">${f}</div>
          </div>
          <div class="product-card-footer">
            <button class="btn btn-primary btn-sm w-full add-to-cart-btn"
              data-id="${i.id}"
              data-name="${i.name}"
              data-price="${i.price}"
              ${i.stock===0?"disabled":""}
            >
              ${i.stock===0?"Sold Out":"🛒 Add to Cart"}
            </button>
          </div>
        </div>
      `}e?$("#product-grid").append(r):$("#product-grid").html(r),v(s)}).fail(function(){showToast("Failed to load products","error")}).always(function(){p=!1})}function v(t){if(u){$("#pagination").html(t.page<t.pages?'<button id="load-more-btn" class="btn btn-secondary btn-lg">Load More 🎸</button>':`<p style="color:var(--text-muted);text-align:center">You've seen it all! 🤘</p>`);return}if(t.pages<=1){$("#pagination").html("");return}let e="";const a=t;e+=`<button class="pagination-btn" ${a.page<=1?"disabled":""} data-page="${a.page-1}">&#8249;</button>`;const o=2;for(let n=1;n<=a.pages;n++)n===1||n===a.pages||n>=a.page-o&&n<=a.page+o?e+=`<button class="pagination-btn ${n===a.page?"active":""}" data-page="${n}">${n}</button>`:(n===a.page-o-1||n===a.page+o+1)&&(e+='<span style="color:var(--text-muted);padding:0 4px">…</span>');e+=`<button class="pagination-btn" ${a.page>=a.pages?"disabled":""} data-page="${a.page+1}">&#8250;</button>`,$("#pagination").html(e)}function b(t){$("#product-modal-overlay").addClass("open"),$("body").css("overflow","hidden"),$("#product-modal-body").html('<div style="text-align:center;padding:60px"><div class="spinner"></div></div>'),$.get(`/api/products/${t}`,function(e){const a=e.product,o=a.images||[];let n="";o.length>0?(n='<div class="product-images-grid">',o.forEach((r,i)=>{n+=`<img src="${r.image_path}" alt="${a.name}" loading="lazy" onerror="this.style.display='none'">`}),n+="</div>"):n='<div style="background:var(--bg-tertiary);border-radius:12px;aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;font-size:72px">🎸</div>';const s=a.stock>10?`<span class="badge badge-success">✓ In Stock (${a.stock})</span>`:a.stock>0?`<span class="badge badge-warning">⚠ Low Stock (${a.stock} left)</span>`:'<span class="badge badge-danger">✗ Sold Out</span>';$("#product-modal-body").html(`
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:28px;align-items:start">
        <div>${n}</div>
        <div>
          <h2 style="font-size:24px;font-weight:800;margin-bottom:12px">${a.name}</h2>
          <div style="font-size:32px;font-weight:900;color:var(--accent-red);font-family:'Outfit',sans-serif;margin-bottom:12px">
            $${parseFloat(a.price).toFixed(2)}
          </div>
          <div style="margin-bottom:16px">${s}</div>
          <p style="color:var(--text-secondary);font-size:14px;line-height:1.7;margin-bottom:24px">${a.description||""}</p>

          <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
            <label style="font-size:13px;font-weight:700;color:var(--text-muted);text-transform:uppercase">Qty</label>
            <div class="cart-qty-control">
              <button class="cart-qty-btn" id="modal-qty-dec">−</button>
              <span class="cart-qty-value" id="modal-qty">1</span>
              <button class="cart-qty-btn" id="modal-qty-inc">+</button>
            </div>
          </div>

          <button class="btn btn-primary btn-lg w-full" id="modal-add-to-cart"
            data-id="${a.id}" data-name="${a.name}" data-price="${a.price}"
            ${a.stock===0?"disabled":""}
            style="margin-bottom:10px"
          >
            ${a.stock===0?"Sold Out":"🛒 Add to Cart"}
          </button>
          <a href="/checkout" class="btn btn-secondary btn-lg w-full" style="text-align:center">
            Checkout →
          </a>
        </div>
      </div>
    `)}).fail(function(){$("#product-modal-body").html('<p style="text-align:center;color:var(--danger)">Failed to load product details.</p>')})}function w(){const t=window.Cart.get(),e=$("#checkout-items");if(!e.length)return;if(t.length===0){window.location.href="/";return}let a="";for(const o of t)a+=`
      <div class="order-item-row">
        <div style="flex:1">
          <div class="order-item-name">${o.name}</div>
          <div class="order-item-meta">Qty: ${o.quantity} × $${o.price.toFixed(2)}</div>
        </div>
        <div style="font-weight:700;color:var(--accent-red)">$${(o.price*o.quantity).toFixed(2)}</div>
      </div>
    `;a+=`
    <div class="order-total-row">
      <span class="order-total-label">Total</span>
      <span class="order-total-value">$${window.Cart.total().toFixed(2)}</span>
    </div>
  `,e.html(a)}function y(){if(!$("#orders-container").length)return;if(!window.Auth.getToken()){window.location.href="/login";return}$("#orders-container").html('<div style="text-align:center;padding:60px"><div class="spinner"></div></div>'),$.ajax({url:"/api/transactions/my",headers:window.Auth.authHeaders(),success:function(e){const a=e.transactions;if(!a.length){$("#orders-container").html(`
          <div style="text-align:center;padding:80px 0;color:var(--text-muted)">
            <div style="font-size:56px;margin-bottom:16px">📦</div>
            <h3>No orders yet</h3>
            <p>Start shopping and place your first order!</p>
            <a href="/" class="btn btn-primary mt-3">Shop Now 🎸</a>
          </div>
        `);return}let o="";for(const n of a){const s={pending:"badge-warning",completed:"badge-success",cancelled:"badge-danger"}[n.status]||"badge-silver";let r="";for(const i of n.items||[]){const m=i.product&&i.product.images&&i.product.images.length?`<img class="order-item-img" src="${i.product.images[0].image_path}" alt="${i.product.name}">`:'<div class="order-item-img" style="display:flex;align-items:center;justify-content:center;font-size:20px;background:var(--bg-tertiary);border-radius:6px">🎸</div>';r+=`
            <div class="order-item-row">
              ${m}
              <div style="flex:1">
                <div class="order-item-name">${i.product?i.product.name:"Product"}</div>
                <div class="order-item-meta">Qty: ${i.quantity} × $${parseFloat(i.price).toFixed(2)}</div>
              </div>
              <div style="font-weight:700;color:var(--accent-red)">$${(parseFloat(i.price)*i.quantity).toFixed(2)}</div>
            </div>
          `}o+=`
          <div class="order-card">
            <div class="order-card-header">
              <div>
                <div class="order-id">Order <span>#${n.id}</span></div>
                <div style="font-size:12px;color:var(--text-muted);margin-top:2px">${new Date(n.createdAt).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}</div>
              </div>
              <span class="badge ${s}">${n.status}</span>
            </div>
            <div class="order-card-body">
              ${r}
              <div class="order-total-row">
                <span class="order-total-label">Order Total</span>
                <span class="order-total-value">$${parseFloat(n.total_price).toFixed(2)}</span>
              </div>
            </div>
          </div>
        `}$("#orders-container").html(o)},error:function(){showToast("Failed to load orders","error"),$("#orders-container").html('<p style="text-align:center;color:var(--danger)">Failed to load orders.</p>')}})}$(document).ready(function(){if(window.Cart.updateBadge(),$(document).on("click","#cart-open-btn",()=>window.Cart.open()),$(document).on("click","#cart-overlay, #cart-close-btn",()=>window.Cart.close()),$(document).on("click",".cart-qty-btn",function(){const t=parseInt($(this).data("id")),e=$(this).data("action"),o=window.Cart.get().find(s=>s.id===t);if(!o)return;const n=e==="inc"?o.quantity+1:o.quantity-1;window.Cart.updateQty(t,n)}),$(document).on("click",".cart-remove-btn",function(){const t=parseInt($(this).data("id"));window.Cart.remove(t)}),$(document).on("click",".add-to-cart-btn",function(t){t.stopPropagation();const e={id:parseInt($(this).data("id")),name:$(this).data("name"),price:parseFloat($(this).data("price")),images:[]};window.Cart.add(e)}),$(document).on("click",".quick-view-btn, .product-card",function(t){if($(t.target).hasClass("add-to-cart-btn")||$(t.target).closest(".add-to-cart-btn").length)return;const e=$(this).data("id")||$(this).closest(".product-card").data("id");e&&b(e)}),$(document).on("click","#product-modal-overlay",function(t){($(t.target).is("#product-modal-overlay")||$(t.target).is("#product-modal-close"))&&($("#product-modal-overlay").removeClass("open"),$("body").css("overflow",""))}),$(document).on("click","#modal-qty-dec",function(){const t=$("#modal-qty"),e=parseInt(t.text());e>1&&t.text(e-1)}),$(document).on("click","#modal-qty-inc",function(){const t=$("#modal-qty");t.text(parseInt(t.text())+1)}),$(document).on("click","#modal-add-to-cart",function(){const t=parseInt($("#modal-qty").text()),e={id:parseInt($(this).data("id")),name:$(this).data("name"),price:parseFloat($(this).data("price")),images:[]};window.Cart.add(e,t),$("#product-modal-overlay").removeClass("open"),$("body").css("overflow",""),window.Cart.open()}),$(document).on("click",".pagination-btn",function(){var e;if($(this).prop("disabled")||$(this).hasClass("active"))return;const t=parseInt($(this).data("page"));c=t,d(t,!1),window.scrollTo({top:((e=document.querySelector(".catalog-section"))==null?void 0:e.offsetTop)-80||0,behavior:"smooth"})}),$(document).on("click","#load-more-btn",function(){c<h&&d(c+1,!0)}),$(document).on("click",".scroll-toggle",function(){u=!u,$(".toggle-switch").toggleClass("on",u),d(1,!1)}),$("#navbar-search").length&&($("#navbar-search").autocomplete({source:function(t,e){$.get(`/api/products/autocomplete?q=${encodeURIComponent(t.term)}`,e)},minLength:2,delay:250,select:function(t,e){l=e.item.value,c=1,$("#product-grid").length?d(1,!1):window.location.href=`/?q=${encodeURIComponent(e.item.value)}`}}),$("#navbar-search").on("keydown",function(t){t.key==="Enter"&&(l=$(this).val().trim(),c=1,$("#product-grid").length?d(1,!1):window.location.href=`/?q=${encodeURIComponent(l)}`)})),$("#product-grid").length){const t=new URLSearchParams(window.location.search).get("q");t&&(l=t,$("#navbar-search").val(t)),d(1,!1)}$("#checkout-form").length&&(w(),$("#checkout-form").validate({rules:{full_name:{required:!0,minlength:2},email:{required:!0,email:!0},address:{required:!0,minlength:5},city:{required:!0},zip:{required:!0}},submitHandler:function(){if(!window.Auth.isLoggedIn()){showToast("Please log in to complete checkout","warning"),window.location.href="/login?redirect=/checkout";return}const t=window.Cart.get();if(t.length===0){showToast("Your cart is empty!","warning");return}const e=$("#checkout-submit-btn");e.prop("disabled",!0).html('<span class="spinner" style="width:18px;height:18px;border-width:2px;margin:0"></span> Processing...'),$.ajax({url:"/api/transactions",method:"POST",contentType:"application/json",headers:window.Auth.authHeaders(),data:JSON.stringify({items:t.map(a=>({product_id:a.id,quantity:a.quantity}))}),success:function(a){window.Cart.clear(),showToast(`Order #${a.transaction.id} placed! 🎸`,"success","Order Confirmed"),setTimeout(()=>window.location.href="/orders",1500)},error:function(a){const o=a.responseJSON?a.responseJSON.error:"Checkout failed";showToast(o,"error"),e.prop("disabled",!1).html("Place Order 🤘")}})}})),$("#orders-container").length&&y(),$(document).on("keydown",function(t){t.key==="Escape"&&($("#product-modal-overlay").removeClass("open"),window.Cart.close(),$("body").css("overflow",""))})});
