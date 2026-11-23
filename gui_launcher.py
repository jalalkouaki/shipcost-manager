#!/usr/bin/env python3
"""
ShipCost Optimizer - Desktop GUI Launcher
Author: Jalal Kouaki <jalalkouaki@outlook.com>
Description: A modern desktop GUI controller to launch, monitor, and open
             ShipCost Optimizer on localhost in your default web browser.
"""

import os
import sys
import time
import signal
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

# Ensure user binaries and Node 22 (e.g. ~/.nodejs/bin, ~/.local/bin) are prioritized in PATH
extra_bin_dirs = [
    os.path.expanduser("~/.nodejs/bin"),
    os.path.expanduser("~/.local/bin"),
    "/usr/local/bin",
]
current_path = os.environ.get("PATH", "")
path_parts = [p for p in current_path.split(os.pathsep) if p]
for d in reversed(extra_bin_dirs):
    if os.path.isdir(d) and d not in path_parts:
        path_parts.insert(0, d)
os.environ["PATH"] = os.pathsep.join(path_parts)


def is_port_open(port: int, host: str = "127.0.0.1", timeout: float = 0.25) -> bool:
    """Check if a local port is actively accepting connections."""
    for h in [host, "localhost"]:
        try:
            with socket.create_connection((h, port), timeout=timeout):
                return True
        except (socket.timeout, ConnectionRefusedError, OSError):
            continue
    return False


def kill_port_processes(port: int):
    """Ensure any orphaned process listening on a given port is terminated."""
    try:
        if sys.platform.startswith("win"):
            out = subprocess.check_output(
                f"netstat -ano | findstr :{port}",
                shell=True,
                text=True,
                stderr=subprocess.DEVNULL
            )
            for line in out.strip().splitlines():
                parts = line.strip().split()
                if len(parts) >= 5 and "LISTENING" in parts:
                    pid = parts[-1]
                    if pid.isdigit() and int(pid) > 0:
                        subprocess.run(["taskkill", "/pid", pid, "/T", "/F"], capture_output=True)
        else:
            try:
                subprocess.run(["fuser", "-k", "-9", f"{port}/tcp"], capture_output=True, text=True)
            except Exception:
                try:
                    out = subprocess.check_output(["lsof", "-t", f"-i:{port}"], text=True, stderr=subprocess.DEVNULL)
                    for pid_str in out.strip().splitlines():
                        if pid_str.isdigit():
                            os.kill(int(pid_str), signal.SIGKILL)
                except Exception:
                    pass
    except Exception:
        pass


class ServerManagerGUI:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("ShipCost Optimizer — Localhost Launcher")
        self.root.geometry("700x580")
        self.root.minsize(620, 500)

        # Apply dark slate theme styling
        self.bg_base = "#0f172a"
        self.bg_card = "#1e293b"
        self.bg_terminal = "#0b0f19"
        self.text_main = "#f8fafc"
        self.text_muted = "#94a3b8"
        self.brand = "#6366f1"
        self.success = "#22c55e"
        self.danger = "#ef4444"
        self.warning = "#f59e0b"

        self.root.configure(bg=self.bg_base)

        # Dictionary of active child processes: { "vite": proc, "manager": proc }
        self.processes = {}

        self._setup_styles()
        self._build_ui()

        # Handle window close cleanly
        self.root.protocol("WM_DELETE_WINDOW", self.on_close)

        # Start periodic status check
        self.poll_timer = None
        self.check_server_status()

        # Auto-start servers on opening if enabled
        self.root.after(300, self._maybe_autostart)

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

        # Launch target selector row
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

        self.target_var = tk.StringVar(value="both")
        self.target_var.trace_add("write", lambda *args: self.check_server_status())

        rb_both = tk.Radiobutton(
            mode_row,
            text="Both (:5173 & :9000)",
            variable=self.target_var,
            value="both",
            bg=self.bg_card,
            fg=self.text_main,
            selectcolor=self.bg_base,
            activebackground=self.bg_card,
            activeforeground=self.brand,
            font=("Segoe UI", 9)
        )
        rb_both.pack(side="left", padx=(0, 10))

        rb_vite = tk.Radiobutton(
            mode_row,
            text="Vite App (:5173)",
            variable=self.target_var,
            value="vite",
            bg=self.bg_card,
            fg=self.text_main,
            selectcolor=self.bg_base,
            activebackground=self.bg_card,
            activeforeground=self.brand,
            font=("Segoe UI", 9)
        )
        rb_vite.pack(side="left", padx=(0, 10))

        rb_mgr = tk.Radiobutton(
            mode_row,
            text="Server Manager (:9000)",
            variable=self.target_var,
            value="manager",
            bg=self.bg_card,
            fg=self.text_main,
            selectcolor=self.bg_base,
            activebackground=self.bg_card,
            activeforeground=self.brand,
            font=("Segoe UI", 9)
        )
        rb_mgr.pack(side="left", padx=(0, 10))

        # Auto-start toggle on open
        self.autostart_var = tk.BooleanVar(value=True)
        cb_autostart = tk.Checkbutton(
            mode_row,
            text="Auto-start on launch",
            variable=self.autostart_var,
            bg=self.bg_card,
            fg=self.text_muted,
            selectcolor=self.bg_base,
            activebackground=self.bg_card,
            activeforeground=self.text_main,
            font=("Segoe UI", 8)
        )
        cb_autostart.pack(side="right")

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

    def _safe_after(self, ms: int, func, *args):
        try:
            if self.root.winfo_exists():
                self.root.after(ms, func, *args)
        except Exception:
            pass

    def _maybe_autostart(self):
        """Automatically trigger server start if ports are offline and autostart is enabled."""
        if self.autostart_var.get():
            if not is_port_open(5173) and not is_port_open(9000):
                self.append_log("Auto-start enabled: starting local servers...\n")
                self.start_server()

    def append_log(self, text: str):
        try:
            self.console.insert(tk.END, text)
            self.console.see(tk.END)
        except Exception:
            pass

    def clear_logs(self):
        try:
            self.console.delete("1.0", tk.END)
        except Exception:
            pass

    def open_browser(self, url: str):
        self.append_log(f"Opening browser at: {url}\n")
        webbrowser.open(url)

    def start_server(self):
        target = self.target_var.get()
        started_any = False

        if target in ("both", "vite"):
            if "vite" not in self.processes and not is_port_open(5173):
                self._start_target(
                    "vite",
                    ["npm", "run", "dev"],
                    PROJECT_DIR,
                    "Vite Dev Server (localhost:5173)"
                )
                started_any = True
            elif is_port_open(5173):
                self.append_log("Notice: Vite is already running on localhost:5173.\n")

        if target in ("both", "manager"):
            if "manager" not in self.processes and not is_port_open(9000):
                self._start_target(
                    "manager",
                    ["node", "server.js"],
                    os.path.join(PROJECT_DIR, "server-manager"),
                    "Server Manager (localhost:9000)"
                )
                started_any = True
            elif is_port_open(9000):
                self.append_log("Notice: Server Manager is already running on localhost:9000.\n")

        if started_any or self.processes:
            self.btn_stop.config(state="normal", bg=self.danger, fg="#ffffff")

    def _start_target(self, key: str, cmd: list, cwd: str, target_name: str):
        self.append_log(f"\n--- Starting {target_name} ---\n")
        threading.Thread(
            target=self._run_process,
            args=(key, cmd, cwd, target_name),
            daemon=True
        ).start()

    def _run_process(self, key: str, cmd: list, cwd: str, target_name: str):
        try:
            is_win = sys.platform.startswith("win")
            kwargs = {
                "cwd": cwd,
                "stdout": subprocess.PIPE,
                "stderr": subprocess.STDOUT,
                "text": True,
                "shell": is_win,
                "bufsize": 1,
            }
            if not is_win:
                kwargs["preexec_fn"] = os.setsid

            proc = subprocess.Popen(cmd, **kwargs)
            self.processes[key] = proc

            prefix = "[Vite] " if key == "vite" else "[Manager] "
            for line in iter(proc.stdout.readline, ''):
                if line:
                    self._safe_after(0, self.append_log, f"{prefix}{line}")

            proc.stdout.close()
            ret_code = proc.wait()
            self._safe_after(0, self._on_process_exit, key, target_name, ret_code)
        except Exception as e:
            self._safe_after(0, self.append_log, f"\nError starting {target_name}: {e}\n")
            self._safe_after(0, self._on_process_exit, key, target_name, -1)

    def _on_process_exit(self, key: str, target_name: str, return_code: int):
        self.append_log(f"\n--- {target_name} stopped (exit code: {return_code}) ---\n")
        self.processes.pop(key, None)
        if not self.processes:
            self.btn_start.config(state="normal", bg=self.brand)
            self.btn_stop.config(state="disabled", bg="#334155", fg=self.text_muted)

    def stop_server(self):
        self.append_log("\nStopping servers...\n")
        active = list(self.processes.items())
        self.processes.clear()

        def kill_task():
            # 1. Terminate tracked subprocesses
            for key, proc in active:
                try:
                    if sys.platform.startswith("win"):
                        subprocess.run(
                            ["taskkill", "/pid", str(proc.pid), "/T", "/F"],
                            capture_output=True,
                            text=True
                        )
                    else:
                        try:
                            os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
                            time.sleep(0.1)
                            os.killpg(os.getpgid(proc.pid), signal.SIGKILL)
                        except Exception:
                            try:
                                proc.kill()
                            except Exception:
                                pass
                except Exception as e:
                    self._safe_after(0, self.append_log, f"Error stopping {key}: {e}\n")

            # 2. Free ports 5173 and 9000 from any orphaned background processes
            kill_port_processes(5173)
            kill_port_processes(9000)

            self._safe_after(100, self.append_log, "Servers stopped.\n")
            self._safe_after(150, self.check_server_status)

        threading.Thread(target=kill_task, daemon=True).start()

    def check_server_status(self):
        """Periodically check if localhost:5173 or localhost:9000 is active and synchronize UI."""
        # Clean up any dead processes from self.processes
        for key in list(self.processes.keys()):
            proc = self.processes[key]
            if proc.poll() is not None:
                self.processes.pop(key, None)

        vite_live = is_port_open(5173)
        manager_live = is_port_open(9000)
        target = self.target_var.get()

        # Update status text and dot based on selected target and actual port states
        if target == "vite":
            if vite_live:
                self.status_dot.config(fg=self.success)
                self.status_text.config(
                    text="Online (Web App active on http://localhost:5173)",
                    fg=self.success
                )
            else:
                self.status_dot.config(fg=self.danger)
                self.status_text.config(
                    text="Offline (Port 5173 idle)",
                    fg=self.text_muted
                )
        elif target == "manager":
            if manager_live:
                self.status_dot.config(fg=self.success)
                self.status_text.config(
                    text="Online (Manager active on http://localhost:9000)",
                    fg=self.success
                )
            else:
                self.status_dot.config(fg=self.danger)
                self.status_text.config(
                    text="Offline (Port 9000 idle)",
                    fg=self.text_muted
                )
        else:  # "both"
            if vite_live and manager_live:
                self.status_dot.config(fg=self.success)
                self.status_text.config(
                    text="Online (App on :5173 & Manager on :9000)",
                    fg=self.success
                )
            elif vite_live:
                self.status_dot.config(fg=self.success)
                self.status_text.config(
                    text="Online (App on :5173 active, Manager idle)",
                    fg=self.success
                )
            elif manager_live:
                self.status_dot.config(fg=self.warning)
                self.status_text.config(
                    text="Partially Online (Manager on :9000, Web App offline)",
                    fg=self.warning
                )
            else:
                self.status_dot.config(fg=self.danger)
                self.status_text.config(
                    text="Offline (Ports 5173 & 9000 idle)",
                    fg=self.text_muted
                )

        # Synchronize action buttons
        if vite_live:
            self.btn_open_app.config(state="normal", bg="#059669")
        else:
            self.btn_open_app.config(state="disabled", bg="#334155")

        if manager_live:
            self.btn_open_mgr.config(state="normal", bg="#2563eb")
        else:
            self.btn_open_mgr.config(state="disabled", bg="#334155")

        # Synchronize Start / Stop controls
        has_running = bool(self.processes) or vite_live or manager_live
        if has_running:
            self.btn_stop.config(state="normal", bg=self.danger, fg="#ffffff")
        else:
            self.btn_stop.config(state="disabled", bg="#334155", fg=self.text_muted)

        # If selected target is already fully live, disable start button to avoid duplicates
        target_fully_live = (
            (target == "both" and vite_live and manager_live) or
            (target == "vite" and vite_live) or
            (target == "manager" and manager_live)
        )
        if target_fully_live:
            self.btn_start.config(state="disabled", bg="#334155", fg=self.text_muted)
        else:
            self.btn_start.config(state="normal", bg=self.brand, fg="#ffffff")

        # Schedule next check in 1000ms
        if self.poll_timer:
            self.root.after_cancel(self.poll_timer)
        self.poll_timer = self.root.after(1000, self.check_server_status)

    def on_close(self):
        if self.poll_timer:
            self.root.after_cancel(self.poll_timer)

        for _key, proc in list(self.processes.items()):
            try:
                if sys.platform.startswith("win"):
                    subprocess.run(
                        ["taskkill", "/pid", str(proc.pid), "/T", "/F"],
                        capture_output=True,
                        text=True
                    )
                else:
                    try:
                        os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
                        time.sleep(0.05)
                        os.killpg(os.getpgid(proc.pid), signal.SIGKILL)
                    except Exception:
                        proc.kill()
            except Exception:
                pass

        kill_port_processes(5173)
        kill_port_processes(9000)
        self.root.destroy()


def main():
    root = tk.Tk()
    _app = ServerManagerGUI(root)
    root.mainloop()


if __name__ == "__main__":
    main()
