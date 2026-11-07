# Harshitha Parking Lot Management

A beginner-friendly CRUD website using HTML, CSS, JavaScript, Express.js and MySQL.

## 1. Project structure

```text
Harshitha_Parking_Lot_Management/
│   server.js
│   package.json
│   .env.example
│   .gitignore
│   README.md
└───public/
    │   index.html
    │   style.css
    └───script.js
```

## 2. Before starting

You said you already created the database tables in MySQL Workbench. This project expects these exact table and column names:

- `users`: `user_id`, `name`, `phone`, `email`, `role`
- `parking_slots`: `slot_id`, `slot_number`, `vehicle_type`, `location`, `status`
- `vehicles`: `vehicle_id`, `user_id`, `vehicle_number`, `vehicle_type`, `vehicle_model`
- `parking_records`: `record_id`, `vehicle_id`, `slot_id`, `entry_time`, `exit_time`, `parking_fee`, `status`

The four ID columns should normally be primary keys with `AUTO_INCREMENT`. Make sure your column types and foreign keys are compatible with your existing schema.

## 3. Configure MySQL connection

1. Open this project folder in VS Code.
2. Copy `.env.example` and rename the copy to `.env` (the filename must be exactly `.env`).
3. Open `.env` and enter your MySQL details:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD
DB_NAME=YOUR_EXISTING_DATABASE_NAME
DB_PORT=3306
PORT=3000
```

Use the database name that contains your four existing tables. Do not put your MySQL password in frontend JavaScript.

## 4. Install dependencies

Open VS Code Terminal → New Terminal. Make sure the terminal is inside this project folder, then run:

```bash
npm install
```

## 5. Start the website

```bash
npm start
```

When you see `Server running at http://localhost:3000`, open this address in your browser:

http://localhost:3000

Keep the terminal running while using the website.

## 6. CRUD operations

For each of the four tables:

- **Create:** Click Add New, fill in the form and click Save Record.
- **Read:** Records are displayed in the table.
- **Update:** Click Edit, change the details and save.
- **Delete:** Click Delete and confirm.

The dashboard displays counts for all four tables. The connection indicator shows whether the server can connect to MySQL.

## 7. Common errors

- **Access denied for user:** Check `DB_USER` and `DB_PASSWORD` in `.env`.
- **Unknown database:** Check `DB_NAME`; it must exactly match your existing database name.
- **Table doesn't exist:** Check the table names and selected database in MySQL Workbench.
- **Cannot add or update a child row:** Check that the referenced `user_id`, `vehicle_id` and `slot_id` exist and that foreign-key types match.
- **Port already in use:** Change `PORT=3001` in `.env` and open `http://localhost:3001`.

## Important notes

- This starter project assumes the four ID fields are auto-generated primary keys.
- The form uses sample dropdown choices for role, vehicle type and status. If your database uses different allowed values, adjust the options in `public/script.js`.
- `parking_records.parking_fee` should be a numeric column; `entry_time` and `exit_time` should be date/time columns.
- For a real production system, add login/authentication, server-side validation, role-based access, and safer deletion rules before deployment.
