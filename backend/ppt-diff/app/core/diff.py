#!/usr/bin/env python
"""
PowerPoint diff processor for Git integration
"""
import os
import sys
from difflib import unified_diff
from typing import Dict, List, Optional

import colorama
from colorama import Back, Fore, Style, init

from .pptx_extractor import PPTXExtractor


class PPTXDiffer:
    """Generate diffs for PowerPoint presentations"""

    def __init__(self, file_a: str, file_b: str, filename: str, numlines: int = 3):
        self.file_a = file_a
        self.file_b = file_b
        self.filename = filename
        self.numlines = numlines

    def generate_diff(self) -> List[Dict]:
        """Generate diff between two PowerPoint files"""
        # Extract content from both files
        content_a = self._extract_content(self.file_a) if self.file_a else {}
        content_b = self._extract_content(self.file_b) if self.file_b else {}

        diffs = []

        # Compare metadata
        metadata_diff = self._compare_metadata(
            content_a.get("metadata", {}), content_b.get("metadata", {})
        )
        if metadata_diff:
            diffs.append(metadata_diff)

        # Compare slides
        slide_diffs = self._compare_slides(
            content_a.get("slides", []), content_b.get("slides", [])
        )
        diffs.extend(slide_diffs)

        # Compare notes
        notes_diff = self._compare_notes(
            content_a.get("notes", []), content_b.get("notes", [])
        )
        if notes_diff:
            diffs.append(notes_diff)

        return diffs

    def _extract_content(self, file_path: str) -> Dict:
        """Extract content from PowerPoint file"""
        if not file_path or file_path in ["nul", "/dev/null"]:
            return {}

        try:
            extractor = PPTXExtractor(file_path)
            return extractor.extract_content()
        except Exception as e:
            print(f"Error extracting content from {file_path}: {e}", file=sys.stderr)
            return {}

    def _compare_metadata(self, meta_a: Dict, meta_b: Dict) -> Optional[Dict]:
        """Compare presentation metadata"""
        if not meta_a and not meta_b:
            return None

        # Convert metadata to text format for comparison
        text_a = self._metadata_to_text(meta_a)
        text_b = self._metadata_to_text(meta_b)

        if text_a == text_b:
            return None

        diff_lines = list(
            unified_diff(text_a.split("\n"), text_b.split("\n"), n=self.numlines)
        )

        if not diff_lines:
            return None

        return {
            "type": "metadata",
            "a": f"--- a/{self.filename}/Metadata",
            "b": f"+++ b/{self.filename}/Metadata",
            "diff": self._colorize_diff(diff_lines[2:]),  # Skip the file headers
        }

    def _compare_slides(self, slides_a: List[Dict], slides_b: List[Dict]) -> List[Dict]:
        """Compare slides between presentations"""
        diffs = []

        # Create dictionaries for easier lookup
        slides_a_dict = {slide["slide_number"]: slide for slide in slides_a}
        slides_b_dict = {slide["slide_number"]: slide for slide in slides_b}

        # Get all slide numbers from both presentations
        all_slide_numbers = set(slides_a_dict.keys()) | set(slides_b_dict.keys())

        for slide_num in sorted(all_slide_numbers):
            slide_a = slides_a_dict.get(slide_num)
            slide_b = slides_b_dict.get(slide_num)

            # Handle new slides
            if slide_a and not slide_b:
                diffs.append(
                    {
                        "type": "slide",
                        "slide_number": slide_num,
                        "a": f"--- a/{self.filename}/Slide/{slide_num}",
                        "b": "+++ /dev/null",
                        "diff": self._colorize_removed_slide(slide_a),
                    }
                )
            # Handle deleted slides
            elif slide_b and not slide_a:
                diffs.append(
                    {
                        "type": "slide",
                        "slide_number": slide_num,
                        "a": "--- /dev/null",
                        "b": f"+++ b/{self.filename}/Slide/{slide_num}",
                        "diff": self._colorize_added_slide(slide_b),
                    }
                )
            # Handle modified slides
            elif slide_a and slide_b:
                slide_diff = self._compare_single_slide(slide_a, slide_b, slide_num)
                if slide_diff:
                    diffs.append(slide_diff)

        return diffs

    def _compare_single_slide(
        self, slide_a: Dict, slide_b: Dict, slide_num: int
    ) -> Optional[Dict]:
        """Compare a single slide between presentations"""
        text_a = self._slide_to_text(slide_a)
        text_b = self._slide_to_text(slide_b)

        if text_a == text_b:
            return None

        diff_lines = list(
            unified_diff(text_a.split("\n"), text_b.split("\n"), n=self.numlines)
        )

        if not diff_lines:
            return None

        return {
            "type": "slide",
            "slide_number": slide_num,
            "a": f"--- a/{self.filename}/Slide/{slide_num}",
            "b": f"+++ b/{self.filename}/Slide/{slide_num}",
            "diff": self._colorize_diff(diff_lines[2:]),  # Skip the file headers
        }

    def _compare_notes(
        self, notes_a: List[Dict], notes_b: List[Dict]
    ) -> Optional[Dict]:
        """Compare speaker notes between presentations"""
        if not notes_a and not notes_b:
            return None

        text_a = self._notes_to_text(notes_a)
        text_b = self._notes_to_text(notes_b)

        if text_a == text_b:
            return None

        diff_lines = list(
            unified_diff(text_a.split("\n"), text_b.split("\n"), n=self.numlines)
        )

        if not diff_lines:
            return None

        return {
            "type": "notes",
            "a": f"--- a/{self.filename}/Notes",
            "b": f"+++ b/{self.filename}/Notes",
            "diff": self._colorize_diff(diff_lines[2:]),  # Skip the file headers
        }

    def _metadata_to_text(self, metadata: Dict) -> str:
        """Convert metadata dictionary to text format"""
        lines = []
        for key, value in sorted(metadata.items()):
            if value:
                lines.append(f"{key}: {value}")
        return "\n".join(lines)

    def _slide_to_text(self, slide: Dict) -> str:
        """Convert slide dictionary to text format"""
        lines = []

        if slide.get("title"):
            lines.append(f"Title: {slide['title']}")

        text_content = slide.get("text_content", [])
        for text in text_content:
            if text.strip():
                lines.append(text.strip())

        return "\n".join(lines)

    def _notes_to_text(self, notes: List[Dict]) -> str:
        """Convert notes list to text format"""
        lines = []
        for note in notes:
            lines.append(f"Slide {note['slide_number']} Notes:")
            lines.append(note["notes"])
            lines.append("")  # Empty line separator
        return "\n".join(lines)

    def _colorize_diff(self, diff_lines: List[str]) -> str:
        """Apply color formatting to diff lines"""
        colored_lines = []
        for line in diff_lines:
            if line.startswith("-"):
                colored_lines.append(Fore.RED + line)
            elif line.startswith("+"):
                colored_lines.append(Fore.GREEN + line)
            elif line.startswith("@@"):
                colored_lines.append(Fore.CYAN + line)
            else:
                colored_lines.append(line)
        return "\n".join(colored_lines)

    def _colorize_added_slide(self, slide: Dict) -> str:
        """Color format for added slides"""
        text = self._slide_to_text(slide)
        lines = text.split("\n")
        return "\n".join([Fore.GREEN + "+" + line for line in lines])

    def _colorize_removed_slide(self, slide: Dict) -> str:
        """Color format for removed slides"""
        text = self._slide_to_text(slide)
        lines = text.split("\n")
        return "\n".join([Fore.RED + "-" + line for line in lines])


def main():
    """Main entry point for the diff processor"""
    if not 8 <= len(sys.argv) <= 9:
        print("Unexpected number of arguments")
        sys.exit(1)

    if len(sys.argv) == 8:
        _, presentation_name, presentation_b, _, _, presentation_a, _, _ = sys.argv
        numlines = 3
    else:  # len(sys.argv) == 9
        _, numlines, presentation_name, presentation_b, _, _, presentation_a, _, _ = (
            sys.argv
        )
        numlines = int(numlines)

    # Handle null/dev/null paths
    path_presentation_a = (
        os.path.abspath(presentation_a)
        if presentation_a not in ["nul", "/dev/null"]
        else None
    )
    path_presentation_b = (
        os.path.abspath(presentation_b)
        if presentation_b not in ["nul", "/dev/null"]
        else None
    )

    # Generate diff
    differ = PPTXDiffer(
        path_presentation_a, path_presentation_b, presentation_name, numlines
    )
    diffs = differ.generate_diff()

    # Initialize colorama
    colorama.init(strip=False)

    # Print results
    if diffs:
        print(Style.BRIGHT + f"diff --ppt a/{presentation_name} b/{presentation_name}")
        for diff in diffs:
            print(Style.BRIGHT + diff["a"])
            print(Style.BRIGHT + diff["b"])
            print(diff["diff"])
            print("")
    else:
        print(f"No differences found in {presentation_name}")


if __name__ == "__main__":
    main()
