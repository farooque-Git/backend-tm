const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2/promise");

const app = express();
app.use(bodyParser.json());

// MySQL database connection configuration
const dbConfig = {
  host: "34.131.229.71",
  user: "admin",
  password: "Stephen@321",
  database: "task_manager",
  connectTimeout: 10000,
};

// Helper function to establish a database connection
async function getConnection() {
  return await mysql.createConnection(dbConfig);
}

//db check
app.get("/test-db", async (req, res) => {
  try {
    const connection = await getConnection();
    await connection.end();
    res.status(200).send({ message: "Database connection successful" });
  } catch (error) {
    console.error("Database connection failed:", error);
    res
      .status(500)
      .send({ error: "Database connection failed", details: error.message });
  }
});

// POST /tasks: Add a new task
app.post("/tasks", async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).send({ error: "Name is required." });
  }

  try {
    const connection = await getConnection();
    const [result] = await connection.execute(
      "INSERT INTO tasks (name, status) VALUES (?, ?)",
      [name, "Pending"]
    );
    await connection.end();
    res.status(201).send({ id: result.insertId, name, status: "Pending" });
  } catch (error) {
    console.error("Error inserting task:", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

// GET /tasks: Fetch all tasks
app.get("/tasks", async (req, res) => {
  try {
    const connection = await getConnection();
    const [rows] = await connection.execute("SELECT * FROM tasks");
    await connection.end();
    res.status(200).send(rows);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

// PUT /tasks/:id: Update the status of a specific task
app.put("/tasks/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status || !["Pending", "In Progress", "Completed"].includes(status)) {
    return res.status(400).send({ error: "Valid status is required." });
  }

  try {
    const connection = await getConnection();
    const [result] = await connection.execute(
      "UPDATE tasks SET status = ? WHERE id = ?",
      [status, id]
    );
    await connection.end();

    if (result.affectedRows === 0) {
      return res.status(404).send({ error: "Task not found." });
    }

    res.status(200).send({ message: "Task updated successfully." });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

// DELETE /tasks/:id: Delete a task
app.delete("/tasks/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const connection = await getConnection();
    const [result] = await connection.execute(
      "DELETE FROM tasks WHERE id = ?",
      [id]
    );
    await connection.end();

    if (result.affectedRows === 0) {
      return res.status(404).send({ error: "Task not found." });
    }

    res.status(200).send({ message: "Task deleted successfully." });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

// Export the app as a Google Cloud Function
module.exports = {
  api: app,
};
