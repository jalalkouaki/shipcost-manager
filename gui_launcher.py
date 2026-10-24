#!/usr/bin/env python3
"""
ShipCost Optimizer - Desktop GUI Launcher
Author: Jalal Kouaki <jalalkouaki@outlook.com>
Description: A modern desktop GUI controller to launch, monitor, and open
             ShipCost Optimizer on localhost in your default web browser.
"""

import os
import sys
import socket
import threading
import subprocess
import webbrowser
import tkinter as tk
from tkinter import ttk, messagebox
from tkinter.scrolledtext import ScrolledText

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
VITE_URL = "http://localhost:5173"
MANAGER_URL = "http://localhost:9000"


def is_port_open(port: int, host: str = "127.0.0.1", timeout: float = 0.4) -> bool:
    """Check if a local port is actively accepting connections."""
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except (socket.timeout, ConnectionRefusedError, OSError):
        return False


class ServerManagerGUI:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("ShipCost Optimizer — Localhost Launcher")
        self.root.geometry("680x560")
        self.root.minsize(580, 480)

        # Apply dark slate theme styling
        self.bg_base = "#0f172a"
        self.bg_card = "#1e293b"
        self.bg_terminal = "#0b0f19"
        self.text_main = "#f8fafc"
        self.text_muted = "#94a3b8"
        self.brand = "#6366f1"
        self.success = "#22c55e"
        self.danger = "#ef4444"

        self.root.configure(bg=self.bg_base)

        self.process = None
        self.running_target = None  # 'vite' or 'manager'

        self._setup_styles()
        self._build_ui()

        # Handle window close cleanly
        self.root.protocol("WM_DELETE_WINDOW", self.on_close)

        # Start periodic status check
        self.poll_timer = None
        self.check_server_status()

    def _setup_styles(self):
        style = ttk.Style()
        style.theme_use("clam")

        style.configure(".", background=self.bg_base, foreground=self.text_main)
        style.configure("Card.TFrame", background=self.bg_card, relief="flat")
        style.configure("Base.TFrame", background=self.bg_base)

    def _build_ui(self):
        # Header container
        header_frame = tk.Frame(self.root, bg=self.bg_base)
        header_frame.pack(fill="x", padx=20, pady=(18, 10))

        title_label = tk.Label(
            header_frame,
            text="🚢 ShipCost Optimizer",
            font=("Segoe UI", 16, "bold"),
            bg=self.bg_base,
            fg=self.text_main
        )
        title_label.pack(anchor="w")

        subtitle_label = tk.Label(
            header_frame,
            text="Manage your local development server and open localhost in one click.",
            font=("Segoe UI", 9),
            bg=self.bg_base,
            fg=self.text_muted
        )
        subtitle_label.pack(anchor="w", pady=(2, 0))

        # Status & Control Card
        card = tk.Frame(self.root, bg=self.bg_card, bd=1, relief="solid", highlightthickness=0)
        card.pack(fill="x", padx=20, pady=10)

        # Status indicator row inside card
        status_row = tk.Frame(card, bg=self.bg_card)
        status_row.pack(fill="x", padx=16, pady=(14, 8))

        status_title = tk.Label(
            status_row,
            text="Server Status:",
            font=("Segoe UI", 10, "bold"),
            bg=self.bg_card,
            fg=self.text_main
        )
        status_title.pack(side="left")

        self.status_dot = tk.Label(
            status_row,
            text="●",
            font=("Segoe UI", 12),
            bg=self.bg_card,
            fg=self.danger
        )
        self.status_dot.pack(side="left", padx=(10, 4))

        self.status_text = tk.Label(
            status_row,
            text="Offline (Port 5173 / 9000 idle)",
            font=("Segoe UI", 10),
            bg=self.bg_card,
            fg=self.text_muted
        )
        self.status_text.pack(side="left")

        # Launch target selector
        mode_row = tk.Frame(card, bg=self.bg_card)
        mode_row.pack(fill="x", padx=16, pady=(4, 12))

        mode_lbl = tk.Label(
            mode_row,
            text="Launch Target:",
            font=("Segoe UI", 9, "bold"),
            bg=self.bg_card,
            fg=self.text_muted
        )
        mode_lbl.pack(side="left", padx=(0, 10))

        self.target_var = tk.StringVar(value="vite")
        rb_vite = tk.Radiobutton(
            mode_row,
            text="Vite Frontend (localhost:5173)",
            variable=self.target_var,
            value="vite",
            bg=self.bg_card,
            fg=self.text_main,
            selectcolor=self.bg_base,
            activebackground=self.bg_card,
            activeforeground=self.brand,
            font=("Segoe UI", 9)
        )
        rb_vite.pack(side="left", padx=(0, 12))

        rb_mgr = tk.Radiobutton(
            mode_row,
            text="Node Server Manager (localhost:9000)",
            variable=self.target_var,
            value="manager",
            bg=self.bg_card,
            fg=self.text_main,
            selectcolor=self.bg_base,
            activebackground=self.bg_card,
            activeforeground=self.brand,
            font=("Segoe UI", 9)
        )
        rb_mgr.pack(side="left")

        # Action Buttons row
        btn_row = tk.Frame(card, bg=self.bg_card)
        btn_row.pack(fill="x", padx=16, pady=(0, 16))

        self.btn_start = tk.Button(
            btn_row,
            text="▶ Start Server",
            command=self.start_server,
            font=("Segoe UI", 9, "bold"),
            bg=self.brand,
            fg="#ffffff",
            activebackground="#4f46e5",
            activeforeground="#ffffff",
            relief="flat",
            padx=14,
            pady=6,
            cursor="hand2"
        )
        self.btn_start.pack(side="left", padx=(0, 8))

        self.btn_stop = tk.Button(
            btn_row,
            text="⏹ Stop Server",
            command=self.stop_server,
            font=("Segoe UI", 9),
            bg="#334155",
            fg=self.text_muted,
            activebackground="#475569",
            activeforeground="#ffffff",
            relief="flat",
            padx=14,
            pady=6,
            state="disabled",
            cursor="hand2"
        )
        self.btn_stop.pack(side="left", padx=(0, 12))

        # Open Browser Buttons
        self.btn_open_app = tk.Button(
            btn_row,
            text="🌐 Open App (5173)",
            command=lambda: self.open_browser(VITE_URL),
            font=("Segoe UI", 9, "bold"),
            bg="#059669",
            fg="#ffffff",
            activebackground="#047857",
            activeforeground="#ffffff",
            relief="flat",
            padx=14,
            pady=6,
            cursor="hand2"
        )
        self.btn_open_app.pack(side="left", padx=(0, 8))

        self.btn_open_mgr = tk.Button(
            btn_row,
            text="⚙ Open Manager (9000)",
            command=lambda: self.open_browser(MANAGER_URL),
            font=("Segoe UI", 9),
            bg="#1e293b",
            fg=self.text_main,
            activebackground="#334155",
            activeforeground="#ffffff",
            bd=1,
            relief="solid",
            padx=12,
            pady=5,
            cursor="hand2"
        )
        self.btn_open_mgr.pack(side="left")

        # Terminal / Output Card
        output_header = tk.Frame(self.root, bg=self.bg_base)
        output_header.pack(fill="x", padx=20, pady=(10, 4))

        log_title = tk.Label(
            output_header,
            text="Process Output & Logs",
            font=("Segoe UI", 9, "bold"),
            bg=self.bg_base,
            fg=self.text_muted
        )
        log_title.pack(side="left")

        clear_btn = tk.Button(
            output_header,
            text="Clear",
            command=self.clear_logs,
            font=("Segoe UI", 8),
            bg=self.bg_base,
            fg=self.text_muted,
            activebackground=self.bg_card,
            activeforeground=self.text_main,
            relief="flat",
            cursor="hand2"
        )
        clear_btn.pack(side="right")

        # Console Text Box
        self.console = ScrolledText(
            self.root,
            bg=self.bg_terminal,
            fg="#e2e8f0",
            insertbackground="#e2e8f0",
            font=("Consolas", 9),
            bd=1,
            relief="solid",
            padx=8,
            pady=8
        )
        self.console.pack(fill="both", expand=True, padx=20, pady=(0, 16))
        self.append_log("Ready. Select target and click 'Start Server' or 'Open App'.\n")

    def append_log(self, text: str):
        self.console.insert(tk.END, text)
        self.console.see(tk.END)

    def clear_logs(self):
        self.console.delete("1.0", tk.END)

    def open_browser(self, url: str):
        self.append_log(f"Opening browser at: {url}\n")
        webbrowser.open(url)

    def start_server(self):
        if self.process:
            messagebox.showinfo("Already Running", "A server process is already running from this launcher.")
            return

        target = self.target_var.get()
        self.running_target = target

        if target == "vite":
            cmd = ["npm", "run", "dev"]
            cwd = PROJECT_DIR
            target_name = "Vite Dev Server (npm run dev)"
        else:
            cmd = ["node", "server.js"]
            cwd = os.path.join(PROJECT_DIR, "server-manager")
            target_name = "Server Manager (node server.js)"

        self.append_log(f"\n--- Starting {target_name} ---\n")
        self.btn_start.config(state="disabled", bg="#475569")
        self.btn_stop.config(state="normal", bg=self.danger, fg="#ffffff")

        # Spawn in a separate thread so the GUI does not freeze
        threading.Thread(target=self._run_process, args=(cmd, cwd), daemon=True).start()

    def _run_process(self, cmd, cwd):
        try:
            # Use shell=True on Windows for npm execution
            is_win = sys.platform.startswith("win")
            self.process = subprocess.Popen(
                cmd,
                cwd=cwd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                shell=is_win,
                bufsize=1
            )

            for line in iter(self.process.stdout.readline, ''):
                if line:
                    self.root.after(0, self.append_log, line)

            self.process.stdout.close()
            ret_code = self.process.wait()
            self.root.after(0, self._on_process_exit, ret_code)
        except Exception as e:
            self.root.after(0, self.append_log, f"\nError starting process: {e}\n")
            self.root.after(0, self._on_process_exit, -1)

    def _on_process_exit(self, return_code):
        self.append_log(f"\n--- Server stopped (exit code: {return_code}) ---\n")
        self.process = None
        self.running_target = None
        self.btn_start.config(state="normal", bg=self.brand)
        self.btn_stop.config(state="disabled", bg="#334155", fg=self.text_muted)

    def stop_server(self):
        if not self.process:
            return

        self.append_log("\nStopping server...\n")
        pid = self.process.pid

        def kill_task():
            try:
                if sys.platform.startswith("win"):
                    subprocess.run(
                        ["taskkill", "/pid", str(pid), "/T", "/F"],
                        capture_output=True,
                        text=True
                    )
                else:
                    self.process.terminate()
            except Exception as e:
                self.root.after(0, self.append_log, f"Error stopping: {e}\n")

        threading.Thread(target=kill_task, daemon=True).start()

    def check_server_status(self):
        """Periodically check if localhost:5173 or localhost:9000 is active."""
        vite_live = is_port_open(5173)
        manager_live = is_port_open(9000)

        if vite_live and manager_live:
            self.status_dot.config(fg=self.success)
            self.status_text.config(
                text="Online (App on :5173 & Manager on :9000)",
                fg=self.success
            )
            self.btn_open_app.config(state="normal", bg="#059669")
            self.btn_open_mgr.config(state="normal")
        elif vite_live:
            self.status_dot.config(fg=self.success)
            self.status_text.config(
                text="Online (Web App active on http://localhost:5173)",
                fg=self.success
            )
            self.btn_open_app.config(state="normal", bg="#059669")
        elif manager_live:
            self.status_dot.config(fg=self.success)
            self.status_text.config(
                text="Online (Manager active on http://localhost:9000)",
                fg=self.success
            )
            self.btn_open_mgr.config(state="normal")
        else:
            if not self.process:
                self.status_dot.config(fg=self.danger)
                self.status_text.config(
                    text="Offline (Ports 5173 & 9000 idle)",
                    fg=self.text_muted
                )

        # Check again in 1.5 seconds
        self.poll_timer = self.root.after(1500, self.check_server_status)

    def on_close(self):
        if self.poll_timer:
            self.root.after_cancel(self.poll_timer)

        if self.process:
            pid = self.process.pid
            try:
                if sys.platform.startswith("win"):
                    subprocess.run(
                        ["taskkill", "/pid", str(pid), "/T", "/F"],
                        capture_output=True,
                        text=True
                    )
                else:
                    self.process.terminate()
            except Exception:
                pass

        self.root.destroy()


def main():
    root = tk.Tk()
    app = ServerManagerGUI(root)
    root.mainloop()


if __name__ == "__main__":
    main()
