require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error("❌ TELEGRAM_BOT_TOKEN is missing.");
  process.exit(1);
}

const bot = new TelegramBot(token, {
  polling: true
});

console.log("✅ GOD ELECTRONICS customer bot is running.");

// ======================================================
// PRODUCTS
// ======================================================

const products = [
  { id: "iphone-16", name: "iPhone 16", price: 12999 },
  { id: "iphone-16-pro", name: "iPhone 16 Pro", price: 16999 },
  { id: "iphone-16-pro-max", name: "iPhone 16 Pro Max", price: 17999 },
  { id: "iphone-17", name: "iPhone 17", price: 14999 },
  { id: "iphone-17-pro", name: "iPhone 17 Pro", price: 18999 },
  { id: "iphone-17-pro-max", name: "iPhone 17 Pro Max", price: 19999 },
  { id: "iphone-18-pro", name: "iPhone 18 Pro", price: 21999 },
  { id: "iphone-18-pro-max", name: "iPhone 18 Pro Max", price: 24999 },

  { id: "samsung-s24-ultra", name: "Samsung S24 Ultra", price: 14999 },
  { id: "samsung-s25-ultra", name: "Samsung S25 Ultra", price: 17999 },
  { id: "samsung-s26-ultra", name: "Samsung S26 Ultra", price: 19999 },

  { id: "iqoo-neo-10", name: "iQOO Neo 10", price: 9999 },
  { id: "iqoo-15-5g", name: "iQOO 15 5G", price: 11999 },

  { id: "macbook-air-m2", name: "MacBook Air M2", price: 11999 },
  { id: "macbook-air-m4", name: "MacBook Air M4", price: 14999 },
  { id: "macbook-pro-m4", name: "MacBook Pro M4", price: 24999 },

  { id: "oppo-reno-15-pro", name: "OPPO Reno 15 Pro", price: 12999 },
  { id: "gopro", name: "GoPro", price: 12000 }
];

// ======================================================
// TEMPORARY USER SESSION
// ======================================================

const users = new Map();

function getUser(chatId) {
  if (!users.has(chatId)) {
    users.set(chatId, {
      cart: [],
      selectedProduct: null,
      quantity: 1,
      checkout: {
        name: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        pin: ""
      },
      step: "idle"
    });
  }

  return users.get(chatId);
}

// ======================================================
// HELPERS
// ======================================================

function money(amount) {
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}

function mainMenu() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🛍️ Products", callback_data: "products" }],
        [
          { text: "🛒 My Cart", callback_data: "cart" },
          { text: "📦 My Orders", callback_data: "orders" }
        ],
        [
          { text: "💳 Payment", callback_data: "payment" },
          { text: "📞 Support", callback_data: "support" }
        ]
      ]
    }
  };
}

function productKeyboard() {
  const rows = [];

  for (let i = 0; i < products.length; i += 2) {
    const row = [];

    row.push({
      text: `${products[i].name} — ${money(products[i].price)}`,
      callback_data: `product:${products[i].id}`
    });

    if (products[i + 1]) {
      row.push({
        text: `${products[i + 1].name} — ${money(products[i + 1].price)}`,
        callback_data: `product:${products[i + 1].id}`
      });
    }

    rows.push(row);
  }

  rows.push([{ text: "🏠 Main Menu", callback_data: "home" }]);

  return {
    reply_markup: {
      inline_keyboard: rows
    }
  };
}

function findProduct(id) {
  return products.find((product) => product.id === id);
}

function cartTotal(user) {
  return user.cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
}

function cartText(user) {
  if (user.cart.length === 0) {
    return "🛒 Your cart is empty.";
  }

  let text = "🛒 YOUR CART\n\n";

  user.cart.forEach((item, index) => {
    text += `${index + 1}. ${item.name}\n`;
    text += `Qty: ${item.quantity}\n`;
    text += `Price: ${money(item.price)} each\n`;
    text += `Subtotal: ${money(item.price * item.quantity)}\n\n`;
  });

  text += `💰 Total: ${money(cartTotal(user))}`;

  return text;
}

// ======================================================
// /START
// ======================================================

bot.onText(/^\/start$/, async (msg) => {
  const chatId = msg.chat.id;
  const user = getUser(chatId);

  user.step = "idle";

  await bot.sendMessage(
    chatId,
    `🤖 WELCOME TO GOD ELECTRONICS

Premium Tech. Genuine Products.

🛍️ Shop premium technology
🔐 Secure online payment
📦 Order tracking

Choose an option below:`,
    mainMenu()
  );
});

// ======================================================
// /HELP
// ======================================================

bot.onText(/^\/help$/, async (msg) => {
  await bot.sendMessage(
    msg.chat.id,
    `ℹ️ GOD ELECTRONICS HELP

🛍️ /products — Browse products
🛒 /cart — View cart
📦 /orders — View orders
💳 /payment — Payment information
📞 /support — Contact support`
  );
});

// ======================================================
// /PRODUCTS
// ======================================================

bot.onText(/^\/products$/, async (msg) => {
  await bot.sendMessage(
    msg.chat.id,
    "🛍️ GOD ELECTRONICS PRODUCTS\n\nSelect a product:",
    productKeyboard()
  );
});

// ======================================================
// /CART
// ======================================================

bot.onText(/^\/cart$/, async (msg) => {
  const user = getUser(msg.chat.id);

  const keyboard =
    user.cart.length > 0
      ? {
          reply_markup: {
            inline_keyboard: [
              [{ text: "💳 Checkout", callback_data: "checkout" }],
              [{ text: "🛍️ Continue Shopping", callback_data: "products" }],
              [{ text: "🏠 Main Menu", callback_data: "home" }]
            ]
          }
        }
      : mainMenu();

  await bot.sendMessage(msg.chat.id, cartText(user), keyboard);
});

// ======================================================
// /ORDERS
// ======================================================

bot.onText(/^\/orders$/, async (msg) => {
  await bot.sendMessage(
    msg.chat.id,
    `📦 MY ORDERS

You don't have any confirmed orders yet.

After successful payment verification, your confirmed orders will appear here.`
  );
});

// ======================================================
// /PAYMENT
// ======================================================

bot.onText(/^\/payment$/, async (msg) => {
  await bot.sendMessage(
    msg.chat.id,
    `💳 PAYMENT

Available payment method:

₮ USDT — BEP20 / BNB Smart Chain

❌ Cash on Delivery is not available.

⚠️ Payment is confirmed only after independent backend verification.

Do not send payment until you reach the official checkout/payment screen.`,
    mainMenu()
  );
});

// ======================================================
// /SUPPORT
// ======================================================

bot.onText(/^\/support$/, async (msg) => {
  await bot.sendMessage(
    msg.chat.id,
    `📞 GOD ELECTRONICS SUPPORT

For order or payment support, please contact the store administrator.

Please keep your Order ID and transaction hash available if you already placed an order.`,
    mainMenu()
  );
});

// ======================================================
// CALLBACKS
// ======================================================

bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  const user = getUser(chatId);

  try {
    await bot.answerCallbackQuery(query.id);

    // HOME
    if (data === "home") {
      await bot.sendMessage(
        chatId,
        `🤖 GOD ELECTRONICS

Premium Tech. Genuine Products.

Choose an option:`,
        mainMenu()
      );
      return;
    }

    // PRODUCTS
    if (data === "products") {
      await bot.sendMessage(
        chatId,
        "🛍️ Select a product:",
        productKeyboard()
      );
      return;
    }

    // PRODUCT DETAIL
    if (data.startsWith("product:")) {
      const productId = data.split(":")[1];
      const product = findProduct(productId);

      if (!product) {
        await bot.sendMessage(chatId, "❌ Product not found.");
        return;
      }

      user.selectedProduct = product;
      user.quantity = 1;

      await bot.sendMessage(
        chatId,
        `📱 ${product.name}

💰 Price: ${money(product.price)}

Select quantity:`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: "➖", callback_data: "qty:-1" },
                { text: "1", callback_data: "qty:display" },
                { text: "➕", callback_data: "qty:+1" }
              ],
              [
                {
                  text: "🛒 Add to Cart",
                  callback_data: "addcart"
                }
              ],
              [
                {
                  text: "⚡ Buy Now",
                  callback_data: "buynow"
                }
              ],
              [
                {
                  text: "🛍️ Back to Products",
                  callback_data: "products"
                }
              ]
            ]
          }
        }
      );

      return;
    }

    // QUANTITY
    if (data === "qty:+1") {
      user.quantity = Math.min(user.quantity + 1, 10);

      await bot.sendMessage(
        chatId,
        `Quantity selected: ${user.quantity}`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: "➖", callback_data: "qty:-1" },
                {
                  text: `${user.quantity}`,
                  callback_data: "qty:display"
                },
                { text: "➕", callback_data: "qty:+1" }
              ],
              [
                {
                  text: "🛒 Add to Cart",
                  callback_data: "addcart"
                }
              ],
              [
                {
                  text: "⚡ Buy Now",
                  callback_data: "buynow"
                }
              ]
            ]
          }
        }
      );

      return;
    }

    if (data === "qty:-1") {
      user.quantity = Math.max(user.quantity - 1, 1);

      await bot.sendMessage(
        chatId,
        `Quantity selected: ${user.quantity}`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: "➖", callback_data: "qty:-1" },
                {
                  text: `${user.quantity}`,
                  callback_data: "qty:display"
                },
                { text: "➕", callback_data: "qty:+1" }
              ],
              [
                {
                  text: "🛒 Add to Cart",
                  callback_data: "addcart"
                }
              ],
              [
                {
                  text: "⚡ Buy Now",
                  callback_data: "buynow"
                }
              ]
            ]
          }
        }
      );

      return;
    }

    // ADD TO CART
    if (data === "addcart") {
      if (!user.selectedProduct) {
        await bot.sendMessage(chatId, "❌ Please select a product first.");
        return;
      }

      const existing = user.cart.find(
        (item) => item.id === user.selectedProduct.id
      );

      if (existing) {
        existing.quantity += user.quantity;
      } else {
        user.cart.push({
          id: user.selectedProduct.id,
          name: user.selectedProduct.name,
          price: user.selectedProduct.price,
          quantity: user.quantity
        });
      }

      await bot.sendMessage(
        chatId,
        `✅ Added to cart!

${user.selectedProduct.name}
Quantity: ${user.quantity}
Price: ${money(
          user.selectedProduct.price * user.quantity
        )}

🛒 Cart total: ${money(cartTotal(user))}`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "💳 Checkout", callback_data: "checkout" }],
              [
                {
                  text: "🛍️ Continue Shopping",
                  callback_data: "products"
                }
              ],
              [{ text: "🛒 View Cart", callback_data: "cart" }]
            ]
          }
        }
      );

      return;
    }

    // BUY NOW
    if (data === "buynow") {
      if (!user.selectedProduct) {
        await bot.sendMessage(chatId, "❌ Please select a product first.");
        return;
      }

      user.cart = [
        {
          id: user.selectedProduct.id,
          name: user.selectedProduct.name,
          price: user.selectedProduct.price,
          quantity: user.quantity
        }
      ];

      await bot.sendMessage(
        chatId,
        cartText(user),
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "💳 Checkout", callback_data: "checkout" }],
              [{ text: "❌ Cancel", callback_data: "home" }]
            ]
          }
        }
      );

      return;
    }

    // CART
    if (data === "cart") {
      await bot.sendMessage(chatId, cartText(user), {
        reply_markup: {
          inline_keyboard: [
            ...(user.cart.length
              ? [[
                  {
                    text: "💳 Checkout",
                    callback_data: "checkout"
                  }
                ]]
              : []),
            [{ text: "🛍️ Products", callback_data: "products" }],
            [{ text: "🏠 Main Menu", callback_data: "home" }]
          ]
        }
      });

      return;
    }

    // CHECKOUT
    if (data === "checkout") {
      if (user.cart.length === 0) {
        await bot.sendMessage(
          chatId,
          "🛒 Your cart is empty.",
          mainMenu()
        );
        return;
      }

      user.step = "name";

      await bot.sendMessage(
        chatId,
        `💳 CHECKOUT

Order total: ${money(cartTotal(user))}

Please enter your full name:`
      );

      return;
    }

    // PAYMENT
    if (data === "payment") {
      await bot.sendMessage(
        chatId,
        `💳 PAYMENT INFORMATION

Payment method:
₮ USDT — BEP20 / BNB Smart Chain

Merchant wallet:

0x34d58F4F0f1D4F4c925d8018D997e3E108C1942b

⚠️ IMPORTANT

Payment is NOT considered successful just because a customer submits a transaction hash.

The backend must independently verify the blockchain transaction before the order becomes PAID.

Never send payment to an address obtained from an unofficial message.`,
        mainMenu()
      );

      return;
    }

    // ORDERS
    if (data === "orders") {
      await bot.sendMessage(
        chatId,
        `📦 MY ORDERS

No confirmed orders yet.

Orders appear here only after successful payment verification.`
      );

      return;
    }

    // SUPPORT
    if (data === "support") {
      await bot.sendMessage(
        chatId,
        `📞 SUPPORT

Please contact GOD ELECTRONICS support with your Order ID if you need help.`,
        mainMenu()
      );

      return;
    }
  } catch (error) {
    console.error("Callback error:", error);

    await bot.sendMessage(
      chatId,
      "❌ Something went wrong. Please try again."
    );
  }
});

// ======================================================
// CHECKOUT TEXT HANDLER
// ======================================================

bot.on("message", async (msg) => {
  if (!msg.text) return;

  const text = msg.text.trim();

  if (
    text.startsWith("/") ||
    text.startsWith("🛍️") ||
    text.startsWith("🛒") ||
    text.startsWith("📦")
  ) {
    return;
  }

  const chatId = msg.chat.id;
  const user = getUser(chatId);

  // NAME
  if (user.step === "name") {
    user.checkout.name = text;
    user.step = "phone";

    await bot.sendMessage(
      chatId,
      "📱 Please enter your mobile number:"
    );

    return;
  }

  // PHONE
  if (user.step === "phone") {
    const phone = text.replace(/\s+/g, "");

    if (!/^[+]?[0-9]{10,15}$/.test(phone)) {
      await bot.sendMessage(
        chatId,
        "❌ Please enter a valid mobile number."
      );
      return;
    }

    user.checkout.phone = phone;
    user.step = "address";

    await bot.sendMessage(
      chatId,
      "🏠 Please enter your complete delivery address:"
    );

    return;
  }

  // ADDRESS
  if (user.step === "address") {
    user.checkout.address = text;
    user.step = "city";

    await bot.sendMessage(
      chatId,
      "🏙️ Enter your city:"
    );

    return;
  }

  // CITY
  if (user.step === "city") {
    user.checkout.city = text;
    user.step = "state";

    await bot.sendMessage(
      chatId,
      "🗺️ Enter your state:"
    );

    return;
  }

  // STATE
  if (user.step === "state") {
    user.checkout.state = text;
    user.step = "pin";

    await bot.sendMessage(
      chatId,
      "📮 Enter your 6-digit PIN code:"
    );

    return;
  }

  // PIN
  if (user.step === "pin") {
    if (!/^[0-9]{6}$/.test(text)) {
      await bot.sendMessage(
        chatId,
        "❌ Please enter a valid 6-digit PIN code."
      );
      return;
    }

    user.checkout.pin = text;
    user.step = "payment";

    await bot.sendMessage(
      chatId,
      `🧾 ORDER SUMMARY

Name: ${user.checkout.name}
Mobile: ${user.checkout.phone}

Address:
${user.checkout.address}
${user.checkout.city}, ${user.checkout.state}
PIN: ${user.checkout.pin}

${cartText(user)}

💳 Payment Method

USDT — BEP20 / BNB Smart Chain

❌ Cash on Delivery is not available.

Payment must be independently verified before your order becomes successful.`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "💳 Continue to Payment",
                callback_data: "payment"
              }
            ],
            [
              {
                text: "❌ Cancel",
                callback_data: "home"
              }
            ]
          ]
        }
      }
    );

    return;
  }
});

// ======================================================
// ERROR HANDLING
// ======================================================

bot.on("polling_error", (error) => {
  console.error("Telegram polling error:", error.message);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection:", error);
});
