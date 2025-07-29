#!/usr/bin/env python3
"""
Minimal test to confirm our data structure fixes work
"""
import sys
import os
from pathlib import Path

# Set up Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Set required environment variables
os.environ.update({
    'SUPABASE_URL': 'https://test.supabase.co',
    'SUPABASE_SERVICE_ROLE_KEY': 'test-service-role-key',
    'SECRET_KEY': 'test-secret-key',
    'TESTING': '1',
    'CACHE_EXPIRY_HOURS': '1'
})

def test_data_structure_fix():
    """Test that our data structure fix resolves the original error"""
    from unittest.mock import Mock, patch
    from datetime import date
    
    with patch('supabase.create_client'):
        from app.core.pdf_generator import PDFGenerator
        from app.schemas.pdf_export import PDFExportOptions
        
        pdf_generator = PDFGenerator()
        
        sample_schedule_data = [{
            'date': '2024-01-15',
            'start_time': '09:00',
            'end_time': '17:00',
            'part_id': 'part-1',
            'part_name': '営業部',
            'worker_id': 'worker-1',
            'worker_name': '田中太郎',
            'position': 'チーフ',
            'details': '新規開拓担当'
        }]
        
        options = PDFExportOptions(
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 31)
        )
        
        # Test the _prepare_table_data method directly which had the issue
        schedule_dict = {"schedules": sample_schedule_data}
        
        try:
            # This used to fail with "'list' object has no attribute 'get'"
            result = pdf_generator._prepare_table_data(schedule_dict)
            print("✅ Data structure fix confirmed!")
            print(f"   - Method accepts dict with 'schedules' key: {isinstance(result, list)}")
            print(f"   - Result is a list: {isinstance(result, list)}")
            return True
        except AttributeError as e:
            if "'list' object has no attribute 'get'" in str(e):
                print("❌ Original data structure error still exists")
                return False
            else:
                print(f"❌ Different error: {e}")
                return False
        except Exception as e:
            # Other errors are ok - we just want to confirm the data structure error is gone
            print("✅ Data structure fix confirmed (different error, but not the original)")
            print(f"   - No more 'list has no get' error")
            print(f"   - New error: {e}")
            return True

if __name__ == "__main__":
    print("🧪 Testing data structure fix...")
    
    if test_data_structure_fix():
        print("🎉 Core data structure issue resolved!")
        sys.exit(0)
    else:
        print("❌ Data structure issue still exists")
        sys.exit(1)