# Fix MongoDB Connection Error

The error `ECONNREFUSED ::1:27017` means **MongoDB is not running** on your computer.

Since **Docker Desktop is not running**, you cannot use the Docker method I previously set up. You have two options:

## Option A: Install MongoDB Locally (Easiest for Local Dev)

1.  **Download**: Go to [MongoDB Community Server Download](https://www.mongodb.com/try/download/community).
2.  **Install**: Run the installer. **Important**: Select "Install MongoDB as a Service".
3.  **Verify**: Open Task Manager and check if `MongoDB Server` is running.
4.  **Restart App**: Run `npm run dev` again.

## Option B: Use MongoDB Atlas (Cloud Database)

1.  Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up (free).
2.  Create a cluster.
3.  Get the connection string (it looks like `mongodb+srv://<user>:<password>@cluster0.mongodb.net/...`).
4.  Create a `.env` file in this folder and add:
    ```
    MONGODB_URI=your_connection_string_here
    ```

## Option C: Start Docker Desktop

If you have Docker Desktop installed, simply **open the Docker Desktop application**. Once the whale icon stops animating, run:
```powershell
docker-compose up
```
This will automatically download and start MongoDB for you.
