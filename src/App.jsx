
import { useState } from "react";
import "./App.css";

const API = "https://staging.fastor.ai";

const foodItems = [
  { id: 1, name: "Strawberry Shake", price: 20, category: "Drinks", emoji: "🍓" },
  { id: 2, name: "Chicken Burger", price: 20, category: "Burgers", emoji: "🍔" },
  { id: 3, name: "Sushi Wave", price: 20, category: "Sushi", emoji: "🍣" },
];

const orders = [
  { id: 1, name: "Strawberry Shake", date: "29 Nov, 01:20 pm", count: "2 items", emoji: "🍓" },
  { id: 2, name: "Chicken Burger", date: "17 Oct, 01:20 pm", count: "1 item", emoji: "🍔" },
  { id: 3, name: "Sushi Wave", date: "22 Apr, 01:20 pm", count: "2 items", emoji: "🍣" },
];

function App() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("phone");
  const [token, setToken] = useState("");
  const [restaurants, setRestaurants] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState(foodItems[2]);
  const [portion, setPortion] = useState("Personal");
  const [quantity, setQuantity] = useState(1);
  const [cartCount, setCartCount] = useState(0);
  const [search, setSearch] = useState("");

  async function requestOtp(event) {
    event.preventDefault();
    setMessage("");

    if (!/^\d{10}$/.test(phone)) {
      setMessage("Please enter a valid 10-digit phone number.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API}/v1/pwa/user/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, dial_code: "+91" }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed.");
      }

      setStep("otp");
      setMessage(data.message || "");
    } catch (error) {
      setMessage(error.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(event) {
    event.preventDefault();
    setMessage("");

    if (!/^\d{6}$/.test(otp)) {
      setMessage("Please enter the 6-digit OTP.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API}/v1/pwa/user/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp, dial_code: "+91" }),
      });

      const data = await response.json();
      const authToken = data.data?.token;

      if (!response.ok || !authToken) {
        throw new Error(data.message || "OTP verification failed.");
      }

      setToken(authToken);
      await loadRestaurants(authToken);
    } catch (error) {
      setMessage(error.message || "Unable to verify OTP.");
    } finally {
      setLoading(false);
    }
  }

  async function loadRestaurants(authToken) {
    try {
      const response = await fetch(
        `${API}/v1/m/restaurant?city_id=118`,
        { headers: { Authorization: `Bearer ${authToken}` } },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load restaurants.");
      }

      const list = data.data?.results;

      if (!Array.isArray(list)) {
        throw new Error("The restaurant response format was unexpected.");
      }

      setRestaurants(list);
      setStep("home");
      setMessage(`Loaded ${list.length} restaurants.`);
    } catch (error) {
      setMessage(error.message || "Could not load restaurants.");
    }
  }

  function openFood(food) {
    setSelectedFood(food);
    setQuantity(1);
    setPortion("Personal");
    setStep("detail");
    setMessage("");
  }

  function addToCart() {
    setCartCount((count) => count + quantity);
    setMessage(`${quantity} × ${selectedFood.name} added to your cart.`);
    setStep("home");
  }

  const visibleRestaurants = restaurants.filter((restaurant) =>
    (restaurant.restaurant_name || "")
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  if (step === "phone" || step === "otp") {
    return (
      <main className="auth-page">
        <section className="auth-panel">
          <div className="auth-logo">F</div>

          {step === "phone" ? (
            <>
              <h1>Sign Up to Fastor</h1>
              <p className="auth-subtitle">
                Let us know your mobile number and we will send you an OTP
                for verification.
              </p>

              <form onSubmit={requestOtp}>
                <label className="field-label" htmlFor="phone">
                  Mobile number
                </label>
                <div className="phone-input">
                  <span>+91</span>
                  <span className="phone-divider">|</span>
                  <input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="Enter mobile number"
                    value={phone}
                    onChange={(event) =>
                      setPhone(event.target.value.replace(/\D/g, ""))
                    }
                    required
                  />
                </div>

                <button className="primary-button" disabled={loading}>
                  {loading ? "Please wait..." : "Get OTP"}
                </button>
              </form>

              <p className="terms">
                By clicking, I accept the <a href="#terms">Terms &amp;
                Conditions</a> and <a href="#privacy">Privacy Policy</a>.
              </p>
            </>
          ) : (
            <>
              <button
                className="back-button"
                onClick={() => {
                  setStep("phone");
                  setOtp("");
                  setMessage("");
                }}
              >
                ← Back
              </button>

              <h1>6-digit code</h1>
              <p className="auth-subtitle">
                Please enter the code we’ve sent to
                <br />
                <strong>+91 {phone}</strong>
              </p>

              <form onSubmit={verifyOtp}>
                <label className="field-label" htmlFor="otp">
                  Verification code
                </label>
                <input
                  id="otp"
                  className="otp-input"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={(event) =>
                    setOtp(event.target.value.replace(/\D/g, ""))
                  }
                  required
                />

                <p className="resend-text">
                  I didn’t receive a code <span>(check your SMS)</span>
                </p>

                <button className="primary-button" disabled={loading}>
                  {loading ? "Verifying..." : "Continue"}
                </button>
              </form>
            </>
          )}

          {message && <p className="status-message" role="status">{message}</p>}
          <p className="auth-footer">Simple ordering starts here.</p>
        </section>
      </main>
    );
  }

  if (step === "detail") {
    const portions = [
      { name: "Personal", detail: "4 pieces", price: 0 },
      { name: "Medium", detail: "8 pieces", price: 3 },
      { name: "Familiar", detail: "10 pieces", price: 6 },
      { name: "Jumbo", detail: "12 pieces", price: 10 },
    ];
    const selectedPortion = portions.find((item) => item.name === portion);
    const total = selectedFood.price + (selectedPortion?.price || 0);

    return (
      <main className="shop-page">
        <header className="shop-header">
          <button className="icon-button" onClick={() => setStep("home")}>←</button>
          <strong>Food details</strong>
          <button className="cart-button" onClick={() => setStep("home")}>
            🛒 <span>{cartCount}</span>
          </button>
        </header>

        <section className="detail-panel">
          <div className="food-hero">
            <span className="food-emoji detail-emoji">{selectedFood.emoji}</span>
            <span className="food-price">₹{total.toFixed(2)}</span>
          </div>

          <div className="detail-content">
            <div className="detail-title-row">
              <div>
                <p className="small-label">{selectedFood.category}</p>
                <h1>{selectedFood.name}</h1>
              </div>
              <div className="quantity-control">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                <strong>{quantity}</strong>
                <button onClick={() => setQuantity(quantity + 1)}>+</button>
              </div>
            </div>

            <p className="detail-description">
              Freshly prepared and full of flavour. Enjoy a delicious choice
              made just for you.
            </p>

            <h2>Choose your portion</h2>
            <div className="portion-list">
              {portions.map((item) => (
                <button
                  key={item.name}
                  className={`portion-option ${portion === item.name ? "selected" : ""}`}
                  onClick={() => setPortion(item.name)}
                >
                  <span className="portion-radio">
                    {portion === item.name ? "●" : "○"}
                  </span>
                  <span className="portion-name">
                    <strong>{item.name}</strong>
                    <small>{item.detail}</small>
                  </span>
                  <strong>{item.price === 0 ? "₹0.00" : `+₹${item.price.toFixed(2)}`}</strong>
                </button>
              ))}
            </div>

            <button className="primary-button add-cart-button" onClick={addToCart}>
              Add to cart · ₹{(total * quantity).toFixed(2)}
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="shop-page">
      <header className="shop-header">
        <div className="location-block">
          <span className="small-label">Current Location</span>
          <strong>📍 Model Town, New Delhi⌄</strong>
        </div>
        <button className="cart-button" onClick={() => setMessage(`Your cart has ${cartCount} item(s).`)}>
          🛒 <span>{cartCount}</span>
        </button>
      </header>

      <section className="welcome-row">
        <div>
          <p className="small-label">Welcome back</p>
          <h1>Karan 👋</h1>
        </div>
        <div className="avatar">K</div>
      </section>

      <label className="search-box">
        <span>⌕</span>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search restaurants"
        />
      </label>

      <section className="promo-banner">
        <div>
          <span className="promo-tag">30% OFF</span>
          <h2>Delicious moments</h2>
          <p>Experience our delicious new dish</p>
          <button onClick={() => openFood(foodItems[2])}>Order now ↗</button>
        </div>
        <div className="promo-food">🍣</div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="small-label">Handpicked for you</p>
            <h2>Popular Items</h2>
          </div>
          <span className="muted-label">See all</span>
        </div>

        <div className="food-grid">
          {foodItems.map((food) => (
            <button
              className="food-card"
              key={food.id}
              onClick={() => openFood(food)}
            >
              <span className="food-emoji">{food.emoji}</span>
              <span className="food-name">{food.name}</span>
              <span className="food-card-bottom">
                <strong>₹{food.price.toFixed(2)}</strong>
                <span className="plus-button">+</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="small-label">Your recent activity</p>
            <h2>Recent Orders</h2>
          </div>
        </div>

        <div className="order-list">
          {orders.map((order) => (
            <article className="order-card" key={order.id}>
              <div className="order-emoji">{order.emoji}</div>
              <div className="order-info">
                <strong>{order.name}</strong>
                <span>{order.date}</span>
                <small>{order.count}</small>
                <div className="order-actions">
                  <button onClick={() => setMessage("Demo action: order cancellation is not connected to an API yet.")}>
                    Cancel Order
                  </button>
                  <button onClick={() => setMessage("Demo action: driver tracking is not connected to an API yet.")}>
                    Track Driver
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="small-label">Explore nearby</p>
            <h2>Restaurants</h2>
          </div>
          <button className="text-button" onClick={() => loadRestaurants(token)}>
            Refresh
          </button>
        </div>

        {visibleRestaurants.length === 0 ? (
          <p className="empty-state">No matching restaurants found.</p>
        ) : (
          <div className="restaurant-grid">
            {visibleRestaurants.map((restaurant) => (
              <article className="restaurant-card" key={restaurant.restaurant_id}>
                <img
                  src={restaurant.logo}
                  alt={restaurant.restaurant_name || "Restaurant"}
                  loading="lazy"
                />
                <div className="restaurant-info">
                  <h3>{restaurant.restaurant_name}</h3>
                  <p>
                    {restaurant.address_complete &&
                    restaurant.address_complete !== "null"
                      ? restaurant.address_complete
                      : "Address not available"}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {message && (
        <div className="toast-message" role="status">
          <span>{message}</span>
          <button onClick={() => setMessage("")}>×</button>
        </div>
      )}

      <nav className="bottom-nav">
        <button className="active" onClick={() => setStep("home")}>⌂<span>Home</span></button>
        <button onClick={() => setMessage("Your orders are shown in Recent Orders.")}>▤<span>Orders</span></button>
        <button onClick={() => setMessage(`Your cart has ${cartCount} item(s).`)}>🛒<span>Cart</span></button>
        <button onClick={() => setMessage("Profile screen is not part of the current API.")}>♙<span>Profile</span></button>
      </nav>
    </main>
  );
}

export default App;
