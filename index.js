const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2/promise");
const ioClient = require("socket.io-client");

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

const socket = ioClient("http://localhost:3000");

async function getConnection() {
  return await mysql.createConnection(dbConfig);
}

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

    const task = { id: result.insertId, name, status: "Pending" };

    socket.emit("taskAdded", task);

    res.status(201).send(task);
  } catch (error) {
    console.error("Error inserting task:", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

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

    socket.emit("taskUpdated", { id, status });

    res.status(200).send({ message: "Task updated successfully." });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

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

    socket.emit("taskDeleted", { id });

    res.status(200).send({ message: "Task deleted successfully." });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

//export google cloud
module.exports = {
  api: app,
};
