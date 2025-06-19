#!/usr/bin/env python
"""
Tests for PPTX diff functionality
"""
import os
import shutil
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

# Add the src directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from src.diff import PPTXDiffer
from src.pptx_extractor import PPTXExtractor


class TestPPTXDiffer(unittest.TestCase):
    """Test cases for PPTXDiffer class"""

    def setUp(self):
        """Set up test fixtures"""
        self.test_file_a = "test_a.pptx"
        self.test_file_b = "test_b.pptx"
        self.filename = "test.pptx"

    def test_init(self):
        """Test PPTXDiffer initialization"""
        differ = PPTXDiffer(self.test_file_a, self.test_file_b, self.filename)
        self.assertEqual(differ.file_a, self.test_file_a)
        self.assertEqual(differ.file_b, self.test_file_b)
        self.assertEqual(differ.filename, self.filename)
        self.assertEqual(differ.numlines, 3)

    def test_init_with_numlines(self):
        """Test PPTXDiffer initialization with custom numlines"""
        differ = PPTXDiffer(
            self.test_file_a, self.test_file_b, self.filename, numlines=5
        )
        self.assertEqual(differ.numlines, 5)

    @patch("src.diff.PPTXExtractor")
    def test_extract_content_with_null_file(self, mock_extractor):
        """Test content extraction with null file paths"""
        differ = PPTXDiffer(None, self.test_file_b, self.filename)
        content = differ._extract_content(None)
        self.assertEqual(content, {})

        content = differ._extract_content("nul")
        self.assertEqual(content, {})

        content = differ._extract_content("/dev/null")
        self.assertEqual(content, {})

    @patch("src.diff.PPTXExtractor")
    def test_extract_content_success(self, mock_extractor_class):
        """Test successful content extraction"""
        # Mock extractor instance
        mock_extractor = MagicMock()
        mock_extractor_class.return_value = mock_extractor

        # Mock extracted content
        mock_content = {
            "metadata": {"title": "Test", "author": "Author"},
            "slides": [{"slide_number": 1, "title": "Slide 1"}],
            "notes": [],
        }
        mock_extractor.extract_content.return_value = mock_content

        differ = PPTXDiffer(self.test_file_a, self.test_file_b, self.filename)
        content = differ._extract_content(self.test_file_a)

        self.assertEqual(content, mock_content)
        mock_extractor_class.assert_called_with(self.test_file_a)
        mock_extractor.extract_content.assert_called_once()

    def test_metadata_to_text(self):
        """Test metadata conversion to text format"""
        differ = PPTXDiffer(self.test_file_a, self.test_file_b, self.filename)

        metadata = {
            "title": "Test Presentation",
            "author": "Test Author",
            "created": "2023-01-01",
            "slide_count": 3,
        }

        expected = "author: Test Author\ncreated: 2023-01-01\nslide_count: 3\ntitle: Test Presentation"
        result = differ._metadata_to_text(metadata)
        self.assertEqual(result, expected)

    def test_metadata_to_text_empty(self):
        """Test metadata conversion with empty metadata"""
        differ = PPTXDiffer(self.test_file_a, self.test_file_b, self.filename)
        result = differ._metadata_to_text({})
        self.assertEqual(result, "")

    def test_slide_to_text(self):
        """Test slide conversion to text format"""
        differ = PPTXDiffer(self.test_file_a, self.test_file_b, self.filename)

        slide = {
            "slide_number": 1,
            "title": "Test Slide",
            "text_content": ["Line 1", "Line 2", "Line 3"],
            "shapes_count": 3,
        }

        expected = "Title: Test Slide\nLine 1\nLine 2\nLine 3"
        result = differ._slide_to_text(slide)
        self.assertEqual(result, expected)

    def test_slide_to_text_no_title(self):
        """Test slide conversion without title"""
        differ = PPTXDiffer(self.test_file_a, self.test_file_b, self.filename)

        slide = {
            "slide_number": 1,
            "title": "",
            "text_content": ["Content only"],
            "shapes_count": 1,
        }

        expected = "Content only"
        result = differ._slide_to_text(slide)
        self.assertEqual(result, expected)

    def test_notes_to_text(self):
        """Test notes conversion to text format"""
        differ = PPTXDiffer(self.test_file_a, self.test_file_b, self.filename)

        notes = [
            {"slide_number": 1, "notes": "Notes for slide 1"},
            {"slide_number": 2, "notes": "Notes for slide 2"},
        ]

        expected = (
            "Slide 1 Notes:\nNotes for slide 1\n\nSlide 2 Notes:\nNotes for slide 2\n"
        )
        result = differ._notes_to_text(notes)
        self.assertEqual(result, expected)

    def test_compare_metadata_no_difference(self):
        """Test metadata comparison with no differences"""
        differ = PPTXDiffer(self.test_file_a, self.test_file_b, self.filename)

        meta_a = {"title": "Same Title", "author": "Same Author"}
        meta_b = {"title": "Same Title", "author": "Same Author"}

        result = differ._compare_metadata(meta_a, meta_b)
        self.assertIsNone(result)

    def test_compare_metadata_with_difference(self):
        """Test metadata comparison with differences"""
        differ = PPTXDiffer(self.test_file_a, self.test_file_b, self.filename)

        meta_a = {"title": "Old Title", "author": "Author"}
        meta_b = {"title": "New Title", "author": "Author"}

        result = differ._compare_metadata(meta_a, meta_b)

        self.assertIsNotNone(result)
        self.assertEqual(result["type"], "metadata")
        self.assertIn("--- a/test.pptx/Metadata", result["a"])
        self.assertIn("+++ b/test.pptx/Metadata", result["b"])
        self.assertIn("diff", result)

    def test_compare_single_slide_no_difference(self):
        """Test single slide comparison with no differences"""
        differ = PPTXDiffer(self.test_file_a, self.test_file_b, self.filename)

        slide_a = {"slide_number": 1, "title": "Same", "text_content": ["Same content"]}
        slide_b = {"slide_number": 1, "title": "Same", "text_content": ["Same content"]}

        result = differ._compare_single_slide(slide_a, slide_b, 1)
        self.assertIsNone(result)

    def test_compare_single_slide_with_difference(self):
        """Test single slide comparison with differences"""
        differ = PPTXDiffer(self.test_file_a, self.test_file_b, self.filename)

        slide_a = {
            "slide_number": 1,
            "title": "Old Title",
            "text_content": ["Old content"],
        }
        slide_b = {
            "slide_number": 1,
            "title": "New Title",
            "text_content": ["New content"],
        }

        result = differ._compare_single_slide(slide_a, slide_b, 1)

        self.assertIsNotNone(result)
        self.assertEqual(result["type"], "slide")
        self.assertEqual(result["slide_number"], 1)
        self.assertIn("--- a/test.pptx/Slide/1", result["a"])
        self.assertIn("+++ b/test.pptx/Slide/1", result["b"])

    def test_compare_slides_added_slide(self):
        """Test slide comparison with added slide"""
        differ = PPTXDiffer(self.test_file_a, self.test_file_b, self.filename)

        slides_a = []
        slides_b = [
            {"slide_number": 1, "title": "New Slide", "text_content": ["New content"]}
        ]

        result = differ._compare_slides(slides_a, slides_b)

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["type"], "slide")
        self.assertEqual(result[0]["slide_number"], 1)
        self.assertIn("--- /dev/null", result[0]["a"])
        self.assertIn("+++ b/test.pptx/Slide/1", result[0]["b"])

    def test_compare_slides_removed_slide(self):
        """Test slide comparison with removed slide"""
        differ = PPTXDiffer(self.test_file_a, self.test_file_b, self.filename)

        slides_a = [
            {"slide_number": 1, "title": "Old Slide", "text_content": ["Old content"]}
        ]
        slides_b = []

        result = differ._compare_slides(slides_a, slides_b)

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["type"], "slide")
        self.assertEqual(result[0]["slide_number"], 1)
        self.assertIn("--- a/test.pptx/Slide/1", result[0]["a"])
        self.assertIn("+++ /dev/null", result[0]["b"])

    def test_colorize_diff(self):
        """Test diff colorization"""
        differ = PPTXDiffer(self.test_file_a, self.test_file_b, self.filename)

        diff_lines = [
            "@@-1,3 +1,3@@",
            " unchanged line",
            "-removed line",
            "+added line",
        ]

        result = differ._colorize_diff(diff_lines)

        # Check that colorization was applied (contains ANSI color codes)
        self.assertIn("\x1b[", result)  # ANSI escape sequence
        self.assertIn("unchanged line", result)
        self.assertIn("removed line", result)
        self.assertIn("added line", result)

    @patch("src.diff.PPTXExtractor")
    def test_generate_diff_comprehensive(self, mock_extractor_class):
        """Test comprehensive diff generation"""
        # Mock extractor instances
        mock_extractor_a = MagicMock()
        mock_extractor_b = MagicMock()
        mock_extractor_class.side_effect = [mock_extractor_a, mock_extractor_b]

        # Mock content for file A
        content_a = {
            "metadata": {"title": "Old Title", "author": "Author"},
            "slides": [
                {
                    "slide_number": 1,
                    "title": "Slide 1",
                    "text_content": ["Old content"],
                },
                {"slide_number": 2, "title": "Slide 2", "text_content": ["Content 2"]},
            ],
            "notes": [{"slide_number": 1, "notes": "Old notes"}],
        }

        # Mock content for file B
        content_b = {
            "metadata": {"title": "New Title", "author": "Author"},
            "slides": [
                {
                    "slide_number": 1,
                    "title": "Slide 1",
                    "text_content": ["New content"],
                },
                {"slide_number": 3, "title": "Slide 3", "text_content": ["New slide"]},
            ],
            "notes": [{"slide_number": 1, "notes": "New notes"}],
        }

        mock_extractor_a.extract_content.return_value = content_a
        mock_extractor_b.extract_content.return_value = content_b

        differ = PPTXDiffer(self.test_file_a, self.test_file_b, self.filename)
        diffs = differ.generate_diff()

        # Should have differences in metadata, slides, and notes
        self.assertGreater(len(diffs), 0)

        # Check that different types of diffs are present
        diff_types = [diff["type"] for diff in diffs]
        self.assertIn("metadata", diff_types)
        self.assertIn("slide", diff_types)
        self.assertIn("notes", diff_types)


class TestPPTXDifferIntegration(unittest.TestCase):
    """Integration tests using real PPTX files"""

    def setUp(self):
        """Set up test with real PPTX file"""
        self.example_file = os.path.join(
            os.path.dirname(__file__),
            "..",
            "..",
            "repository",
            "office-examples",
            "example.pptx",
        )

    def test_diff_identical_files(self):
        """Test diff with identical files"""
        if not os.path.exists(self.example_file):
            self.skipTest("Example PPTX file not found")

        differ = PPTXDiffer(self.example_file, self.example_file, "example.pptx")
        diffs = differ.generate_diff()

        # Should have no differences
        self.assertEqual(len(diffs), 0)

    def test_diff_with_one_null_file(self):
        """Test diff with one null file (simulating new file)"""
        if not os.path.exists(self.example_file):
            self.skipTest("Example PPTX file not found")

        differ = PPTXDiffer(None, self.example_file, "example.pptx")
        diffs = differ.generate_diff()

        # Should have differences (all content is new)
        self.assertGreater(len(diffs), 0)

        # Check that we have slide additions
        slide_diffs = [diff for diff in diffs if diff["type"] == "slide"]
        self.assertGreater(len(slide_diffs), 0)

        # Check that added slides have correct format
        for slide_diff in slide_diffs:
            self.assertIn("--- /dev/null", slide_diff["a"])
            self.assertIn("+++ b/example.pptx/Slide/", slide_diff["b"])


if __name__ == "__main__":
    unittest.main()
