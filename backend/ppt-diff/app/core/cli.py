#!/usr/bin/env python
"""
Git PPT - A Git Extension for PowerPoint
CLI interface for managing PowerPoint files in Git
"""
import os
import subprocess
import sys
from typing import List, Optional

import colorama

VERSION = "1.0.0"
GIT_COMMIT = "dev"
PYTHON_VERSION = (
    f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
)

# PowerPoint file extensions
FILE_EXTENSIONS = ["ppt", "pptx", "potx", "pptm", "potm", "ppsx", "ppsm"]
GIT_ATTRIBUTES_DIFFER = ["*." + file_ext + " diff=ppt" for file_ext in FILE_EXTENSIONS]
GIT_IGNORE = ["~$*." + file_ext for file_ext in FILE_EXTENSIONS]


def is_frozen():
    """Check if running as compiled executable"""
    return getattr(sys, "frozen", False)


def is_git_repository(path):
    """Check if path is a Git repository"""
    cmd = subprocess.run(
        ["git", "rev-parse"],
        cwd=path,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        universal_newlines=True,
        encoding="utf-8",
    )
    return not cmd.stderr.split("\n")[0]


class Installer:
    """Handle installation and uninstallation of Git PPT"""

    def __init__(self, mode="global", path=None):
        # Determine diff command based on environment
        if is_frozen():
            self.GIT_PPT_DIFF = "git-ppt-diff.exe"
        else:
            executable_path = sys.executable.replace("\\", "/")
            differ_path = os.path.join(
                os.path.dirname(os.path.abspath(__file__)), "diff.py"
            ).replace("\\", "/")
            self.GIT_PPT_DIFF = f"{executable_path} {differ_path}"

        # Validate mode and path
        if mode == "global" and path:
            raise ValueError(
                "must not specify repository path when installing globally"
            )
        if mode == "local" and not path:
            raise ValueError("must specify repository path when installing locally")
        if mode == "local" and not is_git_repository(path):
            raise ValueError("not a Git repository")

        self.mode = mode
        self.path = path

        # Set up paths
        self.git_global_config_dir = (
            self.get_global_gitconfig_dir() if self.mode == "global" else None
        )
        self.git_attributes_path = self.get_git_attributes_path()
        self.git_ignore_path = self.get_git_ignore_path()

    def install(self):
        """Install Git PPT"""
        print(f"Installing Git PPT ({self.mode} mode)...")

        # 1. Set up git config for diff.ppt.command
        self.execute(["diff.ppt.command", self.GIT_PPT_DIFF])
        print("✓ Configured git diff command for PowerPoint files")

        # 2. Set up .gitattributes
        self.update_git_file(
            path=self.git_attributes_path, keys=GIT_ATTRIBUTES_DIFFER, operation="SET"
        )
        print("✓ Updated .gitattributes for PowerPoint files")

        # 3. Set up .gitignore
        self.update_git_file(
            path=self.git_ignore_path, keys=GIT_IGNORE, operation="SET"
        )
        print("✓ Updated .gitignore for PowerPoint temporary files")

        # 4. Update global git config (only in global mode)
        if self.mode == "global":
            self.execute(["core.attributesfile", self.git_attributes_path])
            self.execute(["core.excludesfile", self.git_ignore_path])
            print("✓ Updated global git configuration")

        print(f"Git PPT installed successfully in {self.mode} mode!")

    def uninstall(self):
        """Uninstall Git PPT"""
        print(f"Uninstalling Git PPT ({self.mode} mode)...")

        # 1. Remove diff.ppt configuration
        keys = self.execute(["--list"]).split("\n")
        if [key for key in keys if key.startswith("diff.ppt.command")]:
            self.execute(["--remove-section", "diff.ppt"])
            print("✓ Removed git diff configuration")

        # 2. Remove .gitattributes entries
        gitattributes_keys = self.update_git_file(
            path=self.git_attributes_path,
            keys=GIT_ATTRIBUTES_DIFFER,
            operation="REMOVE",
        )
        if not gitattributes_keys:
            if self.mode == "global":
                self.execute(["--unset", "core.attributesfile"])
            self.delete_git_file(self.git_attributes_path)
        print("✓ Updated .gitattributes")

        # 3. Remove .gitignore entries
        gitignore_keys = self.update_git_file(
            path=self.git_ignore_path, keys=GIT_IGNORE, operation="REMOVE"
        )
        if not gitignore_keys:
            if self.mode == "global":
                self.execute(["--unset", "core.excludesfile"])
            self.delete_git_file(self.git_ignore_path)
        print("✓ Updated .gitignore")

        print("Git PPT uninstalled successfully!")

    def execute(self, args):
        """Execute git config command"""
        command = ["git", "config"]
        if self.mode == "global":
            command.append("--global")
        command += args
        result = subprocess.run(
            command,
            cwd=self.path,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True,
            encoding="utf-8",
        )
        return result.stdout

    def get_global_gitconfig_dir(self):
        """Get global git config directory"""
        try:
            f = self.execute(["--list", "--show-origin"])
            p = self.execute(["--list"])
            f = f.split("\n")[0]
            p = p.split("\n")[0]
            return f[: f.index(p)][5:][:-11]
        except:
            return os.path.expanduser("~")

    def get_git_attributes_path(self):
        """Get .gitattributes file path"""
        if self.mode == "local":
            return os.path.join(self.path, ".gitattributes")

        # Check if core.attributesfile is configured
        try:
            core_attributesfile = self.execute(["--get", "core.attributesfile"]).strip()
            if core_attributesfile:
                return os.path.expanduser(core_attributesfile)
        except:
            pass

        # Default to global config directory
        return os.path.join(self.git_global_config_dir, ".gitattributes")

    def get_git_ignore_path(self):
        """Get .gitignore file path"""
        if self.mode == "local":
            return os.path.join(self.path, ".gitignore")

        # Check if core.excludesfile is configured
        try:
            core_excludesfile = self.execute(["--get", "core.excludesfile"]).strip()
            if core_excludesfile:
                return os.path.expanduser(core_excludesfile)
        except:
            pass

        # Default to global config directory
        return os.path.join(self.git_global_config_dir, ".gitignore")

    def update_git_file(self, path, keys, operation):
        """Update git configuration file"""
        assert operation in ("SET", "REMOVE")

        # Read existing content
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                content = [
                    line.strip() for line in f.read().split("\n") if line.strip()
                ]
        else:
            content = []

        # Update content
        if operation == "SET":
            content = sorted(list(set(content).union(set(keys))))
        else:
            content = [line for line in content if line and line not in keys]

        # Write updated content
        if content:
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, "w", encoding="utf-8") as f:
                f.write("\n".join(content) + "\n")
        elif os.path.exists(path):
            os.remove(path)

        return content

    def delete_git_file(self, path):
        """Delete git configuration file"""
        if os.path.exists(path):
            os.remove(path)


class CommandParser:
    """Parse and execute CLI commands"""

    def __init__(self, args):
        self.args = args

    def execute(self):
        """Execute the command"""
        if len(self.args) < 2:
            self.help()
            return

        command = self.args[1]
        command_args = self.args[2:]

        if hasattr(self, command):
            getattr(self, command)(*command_args)
        else:
            print(f"Unknown command: {command}")
            self.help()

    def version(self, *args):
        """Show version information"""
        print(f"Git PPT {VERSION}")
        print(f"Python {PYTHON_VERSION}")
        print(f"Git commit: {GIT_COMMIT}")

    def env(self, *args):
        """Show environment information"""
        print("Git PPT Environment:")
        print(f"Version: {VERSION}")
        print(f"Python: {PYTHON_VERSION}")
        print(f"Platform: {sys.platform}")

        # Check if in git repository
        cwd = os.getcwd()
        if is_git_repository(cwd):
            print(f"Git repository: {cwd}")
        else:
            print("Not in a Git repository")

        # Check git config
        try:
            result = subprocess.run(
                ["git", "config", "--get", "diff.ppt.command"],
                capture_output=True,
                text=True,
            )
            if result.returncode == 0:
                print(f"Git PPT diff command: {result.stdout.strip()}")
            else:
                print("Git PPT not configured")
        except:
            print("Git not available")

    def help(self, *args):
        """Show help information"""
        print(
            f"""Git PPT {VERSION} - A Git Extension for PowerPoint

Usage: git ppt <command> [options]

Commands:
  install [--local]    Install Git PPT (globally or locally)
  uninstall [--local]  Uninstall Git PPT
  version             Show version information
  env                 Show environment information
  help                Show this help message

Examples:
  git ppt install                # Install globally
  git ppt install --local        # Install in current repository
  git ppt uninstall              # Uninstall globally
  git ppt version                # Show version

For more information, visit: https://github.com/your-repo/git-ppt"""
        )

    def install(self, *args):
        """Install Git PPT"""
        local_mode = "--local" in args
        mode = "local" if local_mode else "global"
        path = os.getcwd() if local_mode else None

        try:
            installer = Installer(mode=mode, path=path)
            installer.install()
        except Exception as e:
            print(f"Error: {str(e)}")
            sys.exit(1)

    def uninstall(self, *args):
        """Uninstall Git PPT"""
        local_mode = "--local" in args
        mode = "local" if local_mode else "global"
        path = os.getcwd() if local_mode else None

        try:
            installer = Installer(mode=mode, path=path)
            installer.uninstall()
        except Exception as e:
            print(f"Error: {str(e)}")
            sys.exit(1)


def main():
    """Main entry point"""
    colorama.init()

    parser = CommandParser(sys.argv)
    parser.execute()


if __name__ == "__main__":
    main()
