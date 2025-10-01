# E-commerce Application

A full-stack e-commerce platform built with React, Node.js, Express, and PostgreSQL. Features product management, shopping cart, secure checkout with Stripe, and order tracking.

## Features

- 🛍️ Product browsing and search
- 🛒 Shopping cart management  
- 💳 Secure payments via Stripe
- 📦 Order tracking
- 👤 User authentication
- 📍 Multiple delivery addresses
- 🔐 Seller dashboard
- 📱 Responsive design

## Tech Stack

### Frontend
- React with Vite
- Redux Toolkit for state management
- React Query for data fetching
- Tailwind CSS for styling
- Stripe Elements for payments

### Backend
- Node.js
- Express
- PostgreSQL
- JWT authentication
- Stripe API integration

## Getting Started

### Prerequisites
- Node.js v16+
- PostgreSQL 14+
- npm or yarn
- Stripe account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/hadikhanhk786/ecom-app.git
cd ecom-app
```

2. Install dependencies:
```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

3. Set up environment variables:

Frontend (.env):
```env
VITE_API_URL=http://localhost:4000/api
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

Backend (.env):
```env
PORT=4000
DATABASE_URL=postgresql://username:password@localhost:5432/ecom_db
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
```

4. Initialize database:
```bash
psql -d ecom_db -f backend/models.sql
```

5. Start the development servers:

```bash
# Start backend server
cd backend
npm run dev

# Start frontend development server
cd frontend
npm run dev
```

## Project Structure

```
ecom-app/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── features/
│   │   ├── api/
│   │   └── App.jsx
│   └── package.json
├── backend/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   └── server.js
└── README.md
```

## API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (seller only)
- `PUT /api/products/:id` - Update product (seller only)

### Users
- `POST /api/buyers/register` - Register new buyer
- `POST /api/buyers/login` - Login buyer
- `POST /api/sellers/register` - Register new seller
- `POST /api/sellers/login` - Login seller

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order details

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [React](https://reactjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Payment processing by [Stripe](https://stripe.com/)
