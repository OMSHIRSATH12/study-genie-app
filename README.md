# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

---

## How to Push This Project to GitHub

This guide provides the steps to publish this project to a new repository on your GitHub account.

### Prerequisites

1.  **A GitHub Account:** If you don't have one, sign up for free at [github.com](https://github.com).
2.  **A Terminal/Command Line:** You will need to run these commands in a terminal. Most development environments have a built-in terminal. If you download the project to your computer, you can use the Terminal app on macOS or Command Prompt/PowerShell on Windows.

### Step 1: Create a New, Empty Repository on GitHub

1.  Go to your GitHub account.
2.  Click the **+** icon in the top-right corner and select **New repository**.
3.  Give your repository a name (e.g., `study-genie-app`).
4.  **Important:** Leave all the "Initialize this repository with:" options **unchecked**. You want an empty repository to push your existing files into.
5.  Click **Create repository**.

### Step 2: Run Commands in Your Project's Terminal

Open a terminal and navigate to this project's main folder. Then, run the following commands one by one.

1.  **Initialize Git:** This sets up a new Git repository in your project folder.
    ```bash
    git init -b main
    ```

2.  **Add all files for tracking:** This stages all your files for the first commit. Your `.gitignore` file will ensure your API key in the `.env` file is kept private.
    ```bash
    git add .
    ```

3.  **Commit your files:** This saves a snapshot of your project.
    ```bash
    git commit -m "Initial commit"
    ```

4.  **Link your project to GitHub:** **You must replace `your-username` and `your-repo-name`** with your actual GitHub username and the repository name you created in Step 1.
    ```bash
    git remote add origin https://github.com/your-username/your-repo-name.git
    ```
    *For example, if your username is `OMSHIRSATH12` and your repo is named `study-genie-app`, the command would be:*
    ```bash
    git remote add origin https://github.com/OMSHIRSATH12/study-genie-app.git
    ```

5.  **Push your code to GitHub:** This uploads your project.
    ```bash
    git push -u origin main
    ```

After the last command, your project will be visible on your GitHub repository.
