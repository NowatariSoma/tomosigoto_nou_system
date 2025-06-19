#!/usr/bin/env python
"""
Tests for CLI functionality
"""
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from io import StringIO
from unittest.mock import MagicMock, call, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from src.cli import CommandParser, Installer, is_frozen, is_git_repository, main


class TestUtilityFunctions(unittest.TestCase):
    """Test utility functions"""

    def test_is_frozen(self):
        """Test is_frozen function"""
        # Should return False in normal Python execution
        self.assertFalse(is_frozen())

    @patch("subprocess.run")
    def test_is_git_repository_true(self, mock_run):
        """Test is_git_repository with valid git repository"""
        mock_result = MagicMock()
        mock_result.stderr.split.return_value = [""]
        mock_run.return_value = mock_result

        result = is_git_repository("/path/to/repo")
        self.assertTrue(result)

        mock_run.assert_called_once_with(
            ["git", "rev-parse"],
            cwd="/path/to/repo",
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True,
            encoding="utf-8",
        )

    @patch("subprocess.run")
    def test_is_git_repository_false(self, mock_run):
        """Test is_git_repository with invalid git repository"""
        mock_result = MagicMock()
        mock_result.stderr.split.return_value = ["not a git repository"]
        mock_run.return_value = mock_result

        result = is_git_repository("/path/to/non-repo")
        self.assertFalse(result)


class TestInstaller(unittest.TestCase):
    """Test cases for Installer class"""

    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, self.temp_dir)

    def test_init_global_mode(self):
        """Test Installer initialization in global mode"""
        installer = Installer(mode="global")
        self.assertEqual(installer.mode, "global")
        self.assertIsNone(installer.path)
        self.assertIsNotNone(installer.GIT_PPT_DIFF)

    def test_init_local_mode(self):
        """Test Installer initialization in local mode"""
        with patch("src.cli.is_git_repository", return_value=True):
            installer = Installer(mode="local", path=self.temp_dir)
            self.assertEqual(installer.mode, "local")
            self.assertEqual(installer.path, self.temp_dir)

    def test_init_global_with_path_error(self):
        """Test Installer initialization error: global mode with path"""
        with self.assertRaises(ValueError) as context:
            Installer(mode="global", path="/some/path")
        self.assertIn("must not specify repository path", str(context.exception))

    def test_init_local_without_path_error(self):
        """Test Installer initialization error: local mode without path"""
        with self.assertRaises(ValueError) as context:
            Installer(mode="local")
        self.assertIn("must specify repository path", str(context.exception))

    def test_init_local_non_git_repo_error(self):
        """Test Installer initialization error: local mode with non-git repo"""
        with patch("src.cli.is_git_repository", return_value=False):
            with self.assertRaises(ValueError) as context:
                Installer(mode="local", path=self.temp_dir)
            self.assertIn("not a Git repository", str(context.exception))

    @patch("src.cli.Installer.execute")
    @patch("src.cli.Installer.update_git_file")
    def test_install_global(self, mock_update_git_file, mock_execute):
        """Test global installation"""
        installer = Installer(mode="global")
        installer.git_attributes_path = os.path.join(self.temp_dir, ".gitattributes")
        installer.git_ignore_path = os.path.join(self.temp_dir, ".gitignore")

        installer.install()

        # Check that git config was called
        mock_execute.assert_any_call(["diff.ppt.command", installer.GIT_PPT_DIFF])
        mock_execute.assert_any_call(
            ["core.attributesfile", installer.git_attributes_path]
        )
        mock_execute.assert_any_call(["core.excludesfile", installer.git_ignore_path])

        # Check that git files were updated
        self.assertEqual(mock_update_git_file.call_count, 2)

    @patch("src.cli.Installer.execute")
    @patch("src.cli.Installer.update_git_file")
    def test_install_local(self, mock_update_git_file, mock_execute):
        """Test local installation"""
        with patch("src.cli.is_git_repository", return_value=True):
            installer = Installer(mode="local", path=self.temp_dir)
            installer.install()

            # Check that git config was called (but not global config)
            mock_execute.assert_called_with(
                ["diff.ppt.command", installer.GIT_PPT_DIFF]
            )

            # Check that global config calls were NOT made
            calls = mock_execute.call_args_list
            global_calls = [
                call
                for call in calls
                if "core.attributesfile" in str(call)
                or "core.excludesfile" in str(call)
            ]
            self.assertEqual(len(global_calls), 0)

    @patch("src.cli.Installer.execute")
    @patch("src.cli.Installer.update_git_file")
    @patch("src.cli.Installer.delete_git_file")
    def test_uninstall(self, mock_delete_git_file, mock_update_git_file, mock_execute):
        """Test uninstallation"""
        mock_execute.return_value = "diff.ppt.command=something\n"
        mock_update_git_file.return_value = []  # Empty content after removal

        installer = Installer(mode="global")
        installer.uninstall()

        # Check that git config was removed
        self.assertTrue(mock_execute.called)

        # Check that git files were updated
        self.assertEqual(mock_update_git_file.call_count, 2)

    def test_update_git_file_set(self):
        """Test updating git file with SET operation"""
        installer = Installer(mode="global")

        # Create temporary file
        temp_file = os.path.join(self.temp_dir, "test_file")
        with open(temp_file, "w") as f:
            f.write("existing_line\n")

        keys = ["new_line1", "new_line2"]
        result = installer.update_git_file(temp_file, keys, "SET")

        # Check result
        expected = ["existing_line", "new_line1", "new_line2"]
        self.assertEqual(sorted(result), sorted(expected))

        # Check file content
        with open(temp_file, "r") as f:
            content = f.read().strip().split("\n")
        self.assertEqual(sorted(content), sorted(expected))

    def test_update_git_file_remove(self):
        """Test updating git file with REMOVE operation"""
        installer = Installer(mode="global")

        # Create temporary file
        temp_file = os.path.join(self.temp_dir, "test_file")
        with open(temp_file, "w") as f:
            f.write("line1\nline2\nline3\n")

        keys = ["line2"]
        result = installer.update_git_file(temp_file, keys, "REMOVE")

        # Check result
        expected = ["line1", "line3"]
        self.assertEqual(sorted(result), sorted(expected))

        # Check file content
        with open(temp_file, "r") as f:
            content = f.read().strip().split("\n")
        self.assertEqual(sorted(content), sorted(expected))

    def test_update_git_file_create_new(self):
        """Test creating new git file"""
        installer = Installer(mode="global")

        temp_file = os.path.join(self.temp_dir, "new_file")
        keys = ["line1", "line2"]
        result = installer.update_git_file(temp_file, keys, "SET")

        # Check result
        self.assertEqual(sorted(result), sorted(keys))

        # Check file was created
        self.assertTrue(os.path.exists(temp_file))

        # Check file content
        with open(temp_file, "r") as f:
            content = f.read().strip().split("\n")
        self.assertEqual(sorted(content), sorted(keys))

    def test_delete_git_file(self):
        """Test deleting git file"""
        installer = Installer(mode="global")

        # Create temporary file
        temp_file = os.path.join(self.temp_dir, "test_file")
        with open(temp_file, "w") as f:
            f.write("test content")

        self.assertTrue(os.path.exists(temp_file))

        installer.delete_git_file(temp_file)

        self.assertFalse(os.path.exists(temp_file))

    def test_delete_git_file_nonexistent(self):
        """Test deleting non-existent git file"""
        installer = Installer(mode="global")

        temp_file = os.path.join(self.temp_dir, "nonexistent_file")

        # Should not raise exception
        installer.delete_git_file(temp_file)


class TestCommandParser(unittest.TestCase):
    """Test cases for CommandParser class"""

    def test_init(self):
        """Test CommandParser initialization"""
        args = ["git-ppt", "version"]
        parser = CommandParser(args)
        self.assertEqual(parser.args, args)

    @patch("sys.stdout", new_callable=StringIO)
    def test_version_command(self, mock_stdout):
        """Test version command"""
        args = ["git-ppt", "version"]
        parser = CommandParser(args)
        parser.version()

        output = mock_stdout.getvalue()
        self.assertIn("Git PPT", output)
        self.assertIn("Python", output)

    @patch("sys.stdout", new_callable=StringIO)
    @patch("src.cli.is_git_repository")
    @patch("subprocess.run")
    def test_env_command(self, mock_run, mock_is_git_repo, mock_stdout):
        """Test env command"""
        mock_is_git_repo.return_value = True
        mock_result = MagicMock()
        mock_result.returncode = 0
        mock_result.stdout = "/usr/bin/python /path/to/diff.py"
        mock_run.return_value = mock_result

        args = ["git-ppt", "env"]
        parser = CommandParser(args)
        parser.env()

        output = mock_stdout.getvalue()
        self.assertIn("Git PPT Environment", output)
        self.assertIn("Version:", output)
        self.assertIn("Python:", output)
        self.assertIn("Platform:", output)

    @patch("sys.stdout", new_callable=StringIO)
    def test_help_command(self, mock_stdout):
        """Test help command"""
        args = ["git-ppt", "help"]
        parser = CommandParser(args)
        parser.help()

        output = mock_stdout.getvalue()
        self.assertIn("Git PPT", output)
        self.assertIn("Usage:", output)
        self.assertIn("Commands:", output)
        self.assertIn("install", output)
        self.assertIn("uninstall", output)

    @patch("src.cli.Installer")
    def test_install_command_global(self, mock_installer_class):
        """Test install command in global mode"""
        mock_installer = MagicMock()
        mock_installer_class.return_value = mock_installer

        args = ["git-ppt", "install"]
        parser = CommandParser(args)
        parser.install()

        mock_installer_class.assert_called_once_with(mode="global", path=None)
        mock_installer.install.assert_called_once()

    @patch("src.cli.Installer")
    def test_install_command_local(self, mock_installer_class):
        """Test install command in local mode"""
        mock_installer = MagicMock()
        mock_installer_class.return_value = mock_installer

        args = ["git-ppt", "install", "--local"]
        parser = CommandParser(args)
        parser.install("--local")

        mock_installer_class.assert_called_once_with(
            mode="local", path=unittest.mock.ANY
        )
        mock_installer.install.assert_called_once()

    @patch("src.cli.Installer")
    def test_uninstall_command(self, mock_installer_class):
        """Test uninstall command"""
        mock_installer = MagicMock()
        mock_installer_class.return_value = mock_installer

        args = ["git-ppt", "uninstall"]
        parser = CommandParser(args)
        parser.uninstall()

        mock_installer_class.assert_called_once_with(mode="global", path=None)
        mock_installer.uninstall.assert_called_once()

    @patch("sys.stdout", new_callable=StringIO)
    def test_unknown_command(self, mock_stdout):
        """Test unknown command"""
        args = ["git-ppt", "unknown"]
        parser = CommandParser(args)
        parser.execute()

        output = mock_stdout.getvalue()
        self.assertIn("Unknown command: unknown", output)
        self.assertIn("Usage:", output)  # Should show help

    @patch("sys.stdout", new_callable=StringIO)
    def test_no_command(self, mock_stdout):
        """Test no command provided"""
        args = ["git-ppt"]
        parser = CommandParser(args)
        parser.execute()

        output = mock_stdout.getvalue()
        self.assertIn("Usage:", output)  # Should show help

    @patch("sys.exit")
    @patch("sys.stdout", new_callable=StringIO)
    @patch("src.cli.Installer")
    def test_install_command_failure(
        self, mock_installer_class, mock_stdout, mock_exit
    ):
        """Test install command failure"""
        mock_installer = MagicMock()
        mock_installer.install.side_effect = Exception("Installation failed")
        mock_installer_class.return_value = mock_installer

        args = ["git-ppt", "install"]
        parser = CommandParser(args)
        parser.install()

        output = mock_stdout.getvalue()
        self.assertIn("Error:", output)
        mock_exit.assert_called_once_with(1)


class TestMainFunction(unittest.TestCase):
    """Test cases for main function"""

    @patch("src.cli.CommandParser")
    @patch("colorama.init")
    def test_main(self, mock_colorama_init, mock_command_parser_class):
        """Test main function"""
        mock_parser = MagicMock()
        mock_command_parser_class.return_value = mock_parser

        with patch("sys.argv", ["git-ppt", "version"]):
            main()

        mock_colorama_init.assert_called_once()
        mock_command_parser_class.assert_called_once_with(["git-ppt", "version"])
        mock_parser.execute.assert_called_once()


class TestCLIIntegration(unittest.TestCase):
    """Integration tests for CLI functionality"""

    def setUp(self):
        """Set up test environment"""
        self.temp_dir = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, self.temp_dir)

        # Initialize git repository
        subprocess.run(["git", "init"], cwd=self.temp_dir, capture_output=True)
        subprocess.run(
            ["git", "config", "user.name", "Test User"],
            cwd=self.temp_dir,
            capture_output=True,
        )
        subprocess.run(
            ["git", "config", "user.email", "test@example.com"],
            cwd=self.temp_dir,
            capture_output=True,
        )

    def test_install_uninstall_cycle(self):
        """Test complete install/uninstall cycle"""
        # Test local installation
        installer = Installer(mode="local", path=self.temp_dir)
        installer.install()

        # Check that configuration was applied
        result = subprocess.run(
            ["git", "config", "--get", "diff.ppt.command"],
            cwd=self.temp_dir,
            capture_output=True,
            text=True,
        )
        self.assertEqual(result.returncode, 0)
        self.assertIn("diff.py", result.stdout)

        # Check that .gitattributes was created
        gitattributes_path = os.path.join(self.temp_dir, ".gitattributes")
        self.assertTrue(os.path.exists(gitattributes_path))

        with open(gitattributes_path, "r") as f:
            content = f.read()
            self.assertIn("*.pptx diff=ppt", content)

        # Test uninstallation
        installer.uninstall()

        # Check that configuration was removed
        result = subprocess.run(
            ["git", "config", "--get", "diff.ppt.command"],
            cwd=self.temp_dir,
            capture_output=True,
            text=True,
        )
        self.assertNotEqual(result.returncode, 0)  # Should fail (not found)


if __name__ == "__main__":
    unittest.main()
