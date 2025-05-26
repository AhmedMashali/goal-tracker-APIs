# NestJS Goals API Backend

Backend API for a Goals Management application using NestJS, MongoDB, and JWT. Supports user goal management with nesting and public sharing.

## 1. Tech Stack Summary

* **Framework**: NestJS (TypeScript)
* **Database**: MongoDB with Mongoose (ODM)
* **Authentication**: JWT (JSON Web Tokens) with Passport
* **Configuration**: `@nestjs/config` (`.env` files)
* **Validation**: `class-validator`, `class-transformer`
* **Password Hashing**: `bcrypt`
* **Unique IDs**: `uuid` (for public sharing)

## 2. Setup Instructions

### Installation & Running

1.  **Install Dependencies**:
    ```bash
    npm install
    ```
2.  **Environment Configuration**:
    * Create a `.env` file in the project root (see `.env.example` or below).
    * Update with your details:
        ```env
        DATABASE_URI=mongodb://localhost:27017/goals-tracker
        PORT=3000
        JWT_SECRET=JWT_SECRET_KEY
        JWT_EXPIRATION_TIME=3600s
        ```
3.  **Run**:
    * Ensure MongoDB is running.
    * Start development server:
        ```bash
        npm run start:dev
        ```
    * App typically runs on `http://localhost:3000`.

## 3. Database Choice: MongoDB

* **Why MongoDB?**
    * **Flexibility**: NoSQL schema suits evolving goal structures.
    * **Scalability**: Good horizontal scaling capabilities.
* **Considerations**:
    * Transactions are manageable but can be more complex than SQL for some cases.
    * Requires careful data modeling for relationships.
