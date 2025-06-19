#!/usr/bin/env python
"""
Tests for the PPTXExtractor module
"""
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

# Add the src directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from src.pptx_extractor import PPTXExtractor, extract_pptx_content


class TestPPTXExtractor(unittest.TestCase):
    """Test cases for PPTXExtractor class"""

    def setUp(self):
        """Set up test fixtures"""
        self.test_file_path = "test_presentation.pptx"

    def test_init(self):
        """Test PPTXExtractor initialization"""
        extractor = PPTXExtractor(self.test_file_path)
        self.assertEqual(extractor.file_path, self.test_file_path)
        self.assertIsNone(extractor.presentation)

    def test_extract_content_nonexistent_file(self):
        """Test extraction with non-existent file"""
        extractor = PPTXExtractor("nonexistent.pptx")
        content = extractor.extract_content()
        self.assertEqual(content, {})

    @patch("src.pptx_extractor.Presentation")
    def test_extract_content_success(self, mock_presentation):
        """Test successful content extraction"""
        # Mock presentation object
        mock_pres = MagicMock()
        mock_presentation.return_value = mock_pres

        # Mock core properties
        mock_core_props = MagicMock()
        mock_core_props.title = "Test Presentation"
        mock_core_props.author = "Test Author"
        mock_core_props.subject = "Test Subject"
        mock_core_props.created = None
        mock_core_props.modified = None
        mock_pres.core_properties = mock_core_props

        # Mock slides
        mock_slide = MagicMock()
        mock_slide.shapes = []
        mock_slide.has_notes_slide = False
        mock_pres.slides = [mock_slide]

        # Create temporary file
        with tempfile.NamedTemporaryFile(suffix=".pptx", delete=False) as tmp:
            tmp_path = tmp.name

        try:
            extractor = PPTXExtractor(tmp_path)
            content = extractor.extract_content()

            self.assertIn("metadata", content)
            self.assertIn("slides", content)
            self.assertIn("notes", content)

            # Check metadata
            metadata = content["metadata"]
            self.assertEqual(metadata["title"], "Test Presentation")
            self.assertEqual(metadata["author"], "Test Author")
            self.assertEqual(metadata["slide_count"], 1)

        finally:
            os.unlink(tmp_path)

    def test_to_text_format_empty_content(self):
        """Test text format conversion with empty content"""
        extractor = PPTXExtractor("nonexistent.pptx")
        text = extractor.to_text_format()
        self.assertEqual(text, "")

    def test_extract_pptx_content_function(self):
        """Test the standalone extract_pptx_content function"""
        content = extract_pptx_content("nonexistent.pptx")
        self.assertEqual(content, "")


class TestPPTXExtractorWithRealFile(unittest.TestCase):
    """Test cases using the example PPTX file from office-examples"""

    def setUp(self):
        """Set up test with real PPTX file"""
        # Path to example PPTX file from office-examples repository
        self.example_file = os.path.join(
            os.path.dirname(__file__),
            "..",
            "..",
            "repository",
            "office-examples",
            "example.pptx",
        )

    def test_extract_real_pptx_file(self):
        """Test extraction with real PPTX file if available"""
        if not os.path.exists(self.example_file):
            self.skipTest("Example PPTX file not found")

        extractor = PPTXExtractor(self.example_file)
        content = extractor.extract_content()

        # Basic structure checks
        self.assertIn("metadata", content)
        self.assertIn("slides", content)
        self.assertIn("notes", content)

        # Should have some slides
        slides = content.get("slides", [])
        self.assertGreater(len(slides), 0)

        # Text format should not be empty
        text_content = extractor.to_text_format()
        self.assertGreater(len(text_content), 0)


if __name__ == "__main__":
    unittest.main()
