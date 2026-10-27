
import { useEffect, useState } from "react";
import "./App.css";

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

  // Fetch all orders
  // IMPORTANT: This function must remain outside useEffect
  // so the Refresh Orders button can access it.
  const fetchOrders = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/orders"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await response.json();
      console.log("Orders received:", data);
      setOrders(data.orders);
    } catch (err) {
      console.error("Unable to load orders:", err.message);
    }
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
      const response = await fetch(
        "http://localhost:5000/api/orders",
        {
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
        }
      );

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

      // Update order history immediately after placing an order.
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
        const response = await fetch(
          "http://localhost:5000/api/pizzas"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch pizzas");
        }

        const data = await response.json();
        setPizzas(data.pizzas);
      } catch (err) {
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

        <p className="cart-count">
          🛒 Cart: {cart.length}{" "}
          {cart.length === 1 ? "item" : "items"}
        </p>
      </header>

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
                                    quantity:
                                      item.quantity - 1,
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
                                  quantity:
                                    item.quantity + 1,
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
                <div className="cart-item order-history-item" key={order._id}>
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

                  <div>
                    <strong>
                      Total: ₹{order.totalAmount}
                    </strong>
                    <p>Status: {order.status}</p>
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
    </div>
  );
}

export default App;
