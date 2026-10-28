
import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000/api";

function App() {
  const [pizzas, setPizzas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [cart, setCart] = useState([]);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  const [orderMessage, setOrderMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Authentication state
  const [view, setView] = useState("store");

  const [token, setToken] = useState(
    () => sessionStorage.getItem("slicecraftToken") || ""
  );

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(
        sessionStorage.getItem("slicecraftUser") || "null"
      );
    } catch {
      return null;
    }
  });

  const [authMode, setAuthMode] = useState("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Add a pizza to the cart
  const addToCart = (pizza) => {
    setCart((prevCart) => {
      const existingPizza = prevCart.find(
        (item) => item._id === pizza._id
      );

      if (existingPizza) {
        return prevCart.map((item) =>
          item._id === pizza._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prevCart, { ...pizza, quantity: 1 }];
    });
  };

  // Fetch all orders. Existing order functionality is preserved.
  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/orders`, {
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : {},
      });

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await response.json();
      console.log("Orders received:", data);
      setOrders(data.orders || []);
    } catch (err) {
      console.error("Unable to load orders:", err.message);
    }
  };

  // Update an order's status
  const updateOrderStatus = async (orderId, status) => {
    try {
      const response = await fetch(
        `${API_URL}/orders/${orderId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token
              ? { Authorization: `Bearer ${token}` }
              : {}),
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update order status."
        );
      }

      await fetchOrders();
      alert(data.message || "Order status updated successfully.");
    } catch (err) {
      alert(err.message || "Unable to update order status.");
    }
  };

  // Register a customer or log in an existing account
  const handleAuth = async (event) => {
    event.preventDefault();
    setAuthLoading(true);
    setAuthMessage("");

    const isRegister = authMode === "register";

    try {
      const response = await fetch(
        `${API_URL}/auth/${isRegister ? "register" : "login"}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            isRegister
              ? {
                  name: authName.trim(),
                  email: authEmail.trim(),
                  password: authPassword,
                }
              : {
                  email: authEmail.trim(),
                  password: authPassword,
                }
          ),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Authentication failed."
        );
      }

      if (!data.token || !data.user) {
        throw new Error(
          "The server returned an incomplete login response."
        );
      }

      sessionStorage.setItem("slicecraftToken", data.token);
      sessionStorage.setItem(
        "slicecraftUser",
        JSON.stringify(data.user)
      );

      setToken(data.token);
      setUser(data.user);

      setAuthName("");
      setAuthEmail("");
      setAuthPassword("");
      setAuthMessage("");

      setView("store");

      // Refresh the existing order history after authentication.
      // This does not change the order-history interface.
      if (data.user.role === "admin") {
        await fetchOrders();
      }
    } catch (err) {
      setAuthMessage(
        err.message || "Unable to authenticate."
      );
    } finally {
      setAuthLoading(false);
    }
  };

  // Log out
  const logout = () => {
    sessionStorage.removeItem("slicecraftToken");
    sessionStorage.removeItem("slicecraftUser");

    setToken("");
    setUser(null);
    setView("store");
    setAuthMode("login");
    setAuthMessage("");
  };

  // Place a new order
  const placeOrder = async (event) => {
    event.preventDefault();

    if (cart.length === 0) {
      setOrderMessage("Please add a pizza to your cart.");
      return;
    }

    setSubmitting(true);
    setOrderMessage("");

    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName,
          customerPhone,
          deliveryAddress,
          items: cart.map((pizza) => ({
            pizzaId: pizza._id,
            quantity: pizza.quantity,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to place order."
        );
      }

      setOrderMessage(
        `Order placed successfully! Order ID: ${data.order._id}`
      );

      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setDeliveryAddress("");

      await fetchOrders();
    } catch (err) {
      setOrderMessage(
        err.message || "Unable to place your order."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Load pizzas and orders when the app opens
  useEffect(() => {
    const fetchPizzas = async () => {
      try {
        const response = await fetch(`${API_URL}/pizzas`);

        if (!response.ok) {
          throw new Error("Failed to fetch pizzas");
        }

        const data = await response.json();
        setPizzas(data.pizzas || []);
      } catch {
        setError(
          "Unable to load pizzas. Please check the backend."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPizzas();
    fetchOrders();
  }, []);

  const cartTotal = cart.reduce(
    (total, pizza) =>
      total + pizza.price * pizza.quantity,
    0
  );

  return (
    <div className="app">
      <header className="header">
        <h1>🍕 SliceCraft</h1>
        <p>Crafted with love. Delivered in every slice.</p>

        <div className="header-actions">
          <p className="cart-count">
            🛒 Cart: {cart.length}{" "}
            {cart.length === 1 ? "item" : "items"}
          </p>

          {user ? (
            <div className="auth-header-actions">
              <span className="user-greeting">
                Hello, {user.name}
              </span>

              <button
                type="button"
                className="header-button"
                onClick={logout}
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="header-button"
              onClick={() => {
                setAuthMode("login");
                setAuthMessage("");
                setView("auth");
                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                });
              }}
            >
              Login / Register
            </button>
          )}
        </div>
      </header>

      {view === "auth" && !user ? (
        /* Separate Login and Registration Page */
        <main className="auth-page">
          <button
            type="button"
            className="auth-back-button"
            onClick={() => {
              setView("store");
              setAuthMessage("");
            }}
          >
            ← Back to SliceCraft
          </button>

          <section className="auth-card">
            <div className="auth-visual">
              <div className="auth-visual-content">
                <span className="auth-kicker">
                  FRESH FROM OUR OVEN
                </span>

                <h2>
                  A little slice
                  <br />
                  of happiness.
                </h2>

                <p>
                  Your favorite pizzas are just a few clicks away.
                  Sign in and let the good times roll.
                </p>
              </div>

              <img
                className="auth-pizza-image"
                src="https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=1000&q=85"
                alt="Freshly baked pizza"
              />
            </div>

            <div className="auth-form-panel">
              <span className="auth-brand">🍕 SliceCraft</span>

              <h2>
                {authMode === "login"
                  ? "Welcome back!"
                  : "Create your account"}
              </h2>

              <p className="auth-description">
                {authMode === "login"
                  ? "Sign in to continue your delicious journey."
                  : "Join SliceCraft and discover your new favorite pizza."}
              </p>

              <div className="auth-tabs">
                <button
                  type="button"
                  className={
                    authMode === "login"
                      ? "auth-tab active"
                      : "auth-tab"
                  }
                  onClick={() => {
                    setAuthMode("login");
                    setAuthMessage("");
                  }}
                >
                  Login
                </button>

                <button
                  type="button"
                  className={
                    authMode === "register"
                      ? "auth-tab active"
                      : "auth-tab"
                  }
                  onClick={() => {
                    setAuthMode("register");
                    setAuthMessage("");
                  }}
                >
                  Register
                </button>
              </div>

              <form
                className="auth-form"
                onSubmit={handleAuth}
              >
                {authMode === "register" && (
                  <label>
                    Full name
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      autoComplete="name"
                      value={authName}
                      onChange={(event) =>
                        setAuthName(event.target.value)
                      }
                      minLength={2}
                      maxLength={80}
                      required
                    />
                  </label>
                )}

                <label>
                  Email address
                  <input
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={authEmail}
                    onChange={(event) =>
                      setAuthEmail(event.target.value)
                    }
                    required
                  />
                </label>

                <label>
                  Password
                  <input
                    type="password"
                    placeholder="Minimum 8 characters"
                    autoComplete={
                      authMode === "register"
                        ? "new-password"
                        : "current-password"
                    }
                    value={authPassword}
                    onChange={(event) =>
                      setAuthPassword(event.target.value)
                    }
                    minLength={8}
                    required
                  />
                </label>

                {authMessage && (
                  <p className="auth-message" role="alert">
                    {authMessage}
                  </p>
                )}

                <button
                  type="submit"
                  className="auth-submit-button"
                  disabled={authLoading}
                >
                  {authLoading
                    ? "Please wait..."
                    : authMode === "login"
                      ? "Sign In"
                      : "Create Account"}
                </button>
              </form>

              <p className="auth-switch-text">
                {authMode === "login"
                  ? "New to SliceCraft?"
                  : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(
                      authMode === "login"
                        ? "register"
                        : "login"
                    );
                    setAuthMessage("");
                  }}
                >
                  {authMode === "login"
                    ? "Create an account"
                    : "Sign in"}
                </button>
              </p>

              <p className="auth-note">
                New registrations receive customer access.
              </p>
            </div>
          </section>

          <footer className="auth-footer">
            Made with ❤️ for pizza lovers · SliceCraft
          </footer>
        </main>
      ) : (
        /* Original SliceCraft Website — preserved */
        <main className="menu">
          <h2>Our Pizza Menu</h2>

          {loading && <p>Loading pizzas...</p>}

          {error && <p>{error}</p>}

          {!loading && !error && pizzas.length === 0 && (
            <p>No pizzas available right now.</p>
          )}

          <div className="pizza-grid">
            {pizzas.map((pizza) => (
              <article className="pizza-card" key={pizza._id}>
                <img src={pizza.image} alt={pizza.name} />

                <div className="pizza-info">
                  <span className="category">
                    {pizza.category}
                  </span>

                  <h3>{pizza.name}</h3>
                  <p>{pizza.description}</p>

                  <p className="ingredients">
                    {pizza.ingredients.join(", ")}
                  </p>

                  <div className="pizza-footer">
                    <strong>₹{pizza.price}</strong>

                    <button
                      type="button"
                      disabled={!pizza.isAvailable}
                      onClick={() => addToCart(pizza)}
                    >
                      {pizza.isAvailable
                        ? "Add to Cart"
                        : "Unavailable"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Shopping Cart and Checkout */}
          <section
            className="cart-section"
            aria-labelledby="cart-heading"
          >
            <h2 id="cart-heading">Your Cart</h2>

            {cart.length === 0 ? (
              <p>Your cart is empty.</p>
            ) : (
              <>
                {cart.map((pizza) => (
                  <div className="cart-item" key={pizza._id}>
                    <span>{pizza.name}</span>

                    <div className="quantity-controls">
                      <button
                        type="button"
                        aria-label={`Decrease ${pizza.name} quantity`}
                        onClick={() => {
                          setCart((prevCart) =>
                            prevCart
                              .map((item) =>
                                item._id === pizza._id
                                  ? {
                                      ...item,
                                      quantity: item.quantity - 1,
                                    }
                                  : item
                              )
                              .filter(
                                (item) => item.quantity > 0
                              )
                          );
                        }}
                      >
                        −
                      </button>

                      <span>{pizza.quantity}</span>

                      <button
                        type="button"
                        aria-label={`Increase ${pizza.name} quantity`}
                        onClick={() => {
                          setCart((prevCart) =>
                            prevCart.map((item) =>
                              item._id === pizza._id
                                ? {
                                    ...item,
                                    quantity: item.quantity + 1,
                                  }
                                : item
                            )
                          );
                        }}
                      >
                        +
                      </button>
                    </div>

                    <strong>
                      ₹{pizza.price * pizza.quantity}
                    </strong>
                  </div>
                ))}

                <div className="cart-total">
                  <strong>Total: ₹{cartTotal}</strong>
                </div>

                <form
                  className="checkout-form"
                  onSubmit={placeOrder}
                >
                  <h3>Delivery Details</h3>

                  {orderMessage && (
                    <p
                      aria-live="polite"
                      className={
                        orderMessage.startsWith(
                          "Order placed successfully!"
                        )
                          ? "order-success"
                          : "order-error"
                      }
                    >
                      {orderMessage}
                    </p>
                  )}

                  <input
                    type="text"
                    placeholder="Full Name"
                    value={customerName}
                    onChange={(event) =>
                      setCustomerName(event.target.value)
                    }
                    required
                  />

                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={customerPhone}
                    onChange={(event) =>
                      setCustomerPhone(event.target.value)
                    }
                    pattern="[0-9]{10}"
                    title="Enter a 10-digit phone number"
                    required
                  />

                  <textarea
                    placeholder="Full Delivery Address"
                    value={deliveryAddress}
                    onChange={(event) =>
                      setDeliveryAddress(event.target.value)
                    }
                    rows="3"
                    required
                  />

                  <button
                    type="submit"
                    className="checkout-button"
                    disabled={submitting}
                  >
                    {submitting
                      ? "Placing Order..."
                      : "Place Order"}
                  </button>
                </form>
              </>
            )}
          </section>

          {/* Order History */}
          <section
            className="cart-section"
            aria-labelledby="order-history-heading"
          >
            <h2 id="order-history-heading">Order History</h2>

            <button
              type="button"
              className="checkout-button"
              onClick={fetchOrders}
            >
              Refresh Orders
            </button>

            {orders.length === 0 ? (
              <p>No orders found yet.</p>
            ) : (
              <>
                {orders.map((order) => (
                  <div
                    className="cart-item order-history-item"
                    key={order._id}
                  >
                    <div>
                      <strong>Order ID:</strong>
                      <p>{order._id}</p>

                      <strong>Customer:</strong>
                      <p>{order.customerName}</p>

                      <strong>Items:</strong>

                      {order.items.map((item, index) => (
                        <p key={`${order._id}-${index}`}>
                          {item.name} × {item.quantity}
                        </p>
                      ))}
                    </div>

                    <div className="order-status-controls">
                      <strong>
                        Total: ₹{order.totalAmount}
                      </strong>

                      <p>
                        Current status:{" "}
                        <span
                          className={`status-badge status-${order.status
                            .toLowerCase()
                            .replaceAll(" ", "-")}`}
                        >
                          {order.status}
                        </span>
                      </p>

                      <select
                        value={
                          order.selectedStatus || order.status
                        }
                        onChange={(event) =>
                          setOrders((prevOrders) =>
                            prevOrders.map((item) =>
                              item._id === order._id
                                ? {
                                    ...item,
                                    selectedStatus:
                                      event.target.value,
                                  }
                                : item
                            )
                          )
                        }
                      >
                        {[
                          "Pending",
                          "Confirmed",
                          "Preparing",
                          "Out for Delivery",
                          "Delivered",
                          "Cancelled",
                        ].map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() =>
                          updateOrderStatus(
                            order._id,
                            order.selectedStatus || order.status
                          )
                        }
                      >
                        Update Status
                      </button>
                    </div>
                  </div>
                ))}

                <p>
                  You have placed {orders.length} order(s).
                </p>
              </>
            )}
          </section>
        </main>
      )}
    </div>
  );
}

export default App;
