#!/usr/bin/env python3
import json
import os
import csv
import datetime
import sys
import shutil
import argparse

def ensure_backup_dir():
    """Ensure backup directory exists"""
    backup_dir = "backup"
    if not os.path.exists(backup_dir):
        os.makedirs(backup_dir)
    return backup_dir

def format_json(data):
    """Format JSON data with consistent indentation and sorting"""
    if isinstance(data, list):
        # Special case for coordinates - don't sort them
        if len(data) == 2 and all(isinstance(x, str) and any(c.isdigit() for c in x) for x in data):
            return data
        return sorted([format_json(item) if isinstance(item, (dict, list)) else item for item in data], 
                     key=lambda x: json.dumps(x) if isinstance(x, dict) else str(x))
    elif isinstance(data, dict):
        return {k: format_json(v) if isinstance(v, (dict, list)) else v for k, v in sorted(data.items())}
    return data

def extract_centers_by_branch_code(json_data):
    """Extract centers from JSON data and index them by branch_code"""
    # Check if the JSON has a 'data' field (containing centers)
    if isinstance(json_data, dict) and 'data' in json_data:
        centers = json_data['data']
    elif isinstance(json_data, list):
        centers = json_data
    else:
        centers = []
        
    # Create a dictionary with branch_code as key
    centers_dict = {}
    for center in centers:
        if isinstance(center, dict) and 'branch_code' in center:
            centers_dict[center['branch_code']] = center
            
    return centers_dict

def compare_centers(old_centers, new_centers):
    """
    Compare centers between old and new JSON data based on branch_code field
    Returns lists of added, deleted, and modified entries with detailed field changes
    """
    # Find added, deleted and common branch_codes
    old_branch_codes = set(old_centers.keys())
    new_branch_codes = set(new_centers.keys())
    
    added_branch_codes = new_branch_codes - old_branch_codes
    deleted_branch_codes = old_branch_codes - new_branch_codes
    common_branch_codes = old_branch_codes.intersection(new_branch_codes)
    
    # Prepare results
    comparison_results = []
    
    # Process added entries
    for branch_code in added_branch_codes:
        comparison_results.append({
            'ChangeType': 'Added',
            'branch_code': branch_code,
            'FieldName': '',
            'OldValue': '',
            'NewValue': json.dumps(new_centers[branch_code], ensure_ascii=False)[:200]
        })
    
    # Process deleted entries
    for branch_code in deleted_branch_codes:
        comparison_results.append({
            'ChangeType': 'Deleted',
            'branch_code': branch_code,
            'FieldName': '',
            'OldValue': json.dumps(old_centers[branch_code], ensure_ascii=False)[:200],
            'NewValue': ''
        })
    
    # Process modified entries
    for branch_code in common_branch_codes:
        old_center = old_centers[branch_code]
        new_center = new_centers[branch_code]
        
        # Compare centers field by field
        if old_center != new_center:
            # Get all unique fields from both centers
            all_fields = set(old_center.keys()).union(set(new_center.keys()))
            modified = False
            
            for field in all_fields:
                # Handle nested fields like 'address'
                if field in old_center and field in new_center:
                    if isinstance(old_center[field], dict) and isinstance(new_center[field], dict):
                        # Compare nested dictionary
                        nested_fields = set(old_center[field].keys()).union(set(new_center[field].keys()))
                        
                        for nested_field in nested_fields:
                            old_value = old_center[field].get(nested_field, '')
                            new_value = new_center[field].get(nested_field, '')
                            
                            if old_value != new_value:
                                modified = True
                                comparison_results.append({
                                    'ChangeType': 'Modified',
                                    'branch_code': branch_code,
                                    'FieldName': f"{field}.{nested_field}",
                                    'OldValue': str(old_value),
                                    'NewValue': str(new_value)
                                })
                    # Handle array fields like 'coords'
                    elif isinstance(old_center[field], list) and isinstance(new_center[field], list):
                        if old_center[field] != new_center[field]:
                            modified = True
                            comparison_results.append({
                                'ChangeType': 'Modified',
                                'branch_code': branch_code,
                                'FieldName': field,
                                'OldValue': str(old_center[field]),
                                'NewValue': str(new_center[field])
                            })
                    # Handle scalar fields
                    elif old_center[field] != new_center[field]:
                        modified = True
                        comparison_results.append({
                            'ChangeType': 'Modified',
                            'branch_code': branch_code,
                            'FieldName': field,
                            'OldValue': str(old_center[field]),
                            'NewValue': str(new_center[field])
                        })
                
                # Field exists in old but not in new
                elif field in old_center:
                    modified = True
                    comparison_results.append({
                        'ChangeType': 'Modified',
                        'branch_code': branch_code,
                        'FieldName': field,
                        'OldValue': str(old_center[field]),
                        'NewValue': '<FIELD_REMOVED>'
                    })
                
                # Field exists in new but not in old
                elif field in new_center:
                    modified = True
                    comparison_results.append({
                        'ChangeType': 'Modified',
                        'branch_code': branch_code,
                        'FieldName': field,
                        'OldValue': '<FIELD_ADDED>',
                        'NewValue': str(new_center[field])
                    })
    
    return comparison_results

def main():
    try:
        # Parse command-line arguments
        parser = argparse.ArgumentParser(description='Compare two JSON files based on branch_code field and update the target file.')
        parser.add_argument('--old', dest='old_file', default="Center Locatore.json",
                            help='Path to the old JSON file (default: Center Locatore.json)')
        parser.add_argument('--new', dest='new_file', default="Centers_Raw.json",
                            help='Path to the new JSON file (default: Centers_Raw.json)')
        parser.add_argument('--output', dest='output_file', default=None,
                            help='Path to the output CSV file (default: auto-generated in backup directory)')
        parser.add_argument('--no-update', dest='no_update', action='store_true',
                            help='Do not update the target file with new data')
        args = parser.parse_args()
        
        print("Starting JSON processing script...")
        
        # Define file paths
        old_file = args.old_file
        new_file = args.new_file
        
        # Ensure backup directory exists
        backup_dir = ensure_backup_dir()
        
        # Generate timestamp for the statistics file
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Define file paths with backup directory
        comparison_filename = f"branches_comparison_{timestamp}.csv"
        comparison_file = args.output_file if args.output_file else os.path.join(backup_dir, comparison_filename)
        
        formatted_source_filename = f"formatted_source_{timestamp}.json"
        formatted_source_file = os.path.join(backup_dir, formatted_source_filename)
        
        # Check if files exist
        if not os.path.exists(new_file):
            raise FileNotFoundError(f"Source file '{new_file}' not found")
            
        if not os.path.exists(old_file):
            print(f"Warning: Target file '{old_file}' not found. Will create a new file.")
            old_data = {}
        else:
            # Read old data
            print(f"Reading old file: {old_file}")
            try:
                with open(old_file, 'r', encoding='utf-8') as f:
                    old_data = json.load(f)
                
                # Create a backup of the old file
                old_backup_filename = f"backup_{os.path.basename(old_file)}"
                old_backup = os.path.join(backup_dir, old_backup_filename)
                print(f"Creating backup of old file: {old_backup}")
                shutil.copy2(old_file, old_backup)
            except json.JSONDecodeError:
                print(f"Warning: Target file '{old_file}' contains invalid JSON. Will create a new file.")
                old_data = {}
        
        # Read new data
        print(f"Reading new file: {new_file}")
        with open(new_file, 'r', encoding='utf-8') as f:
            new_data = json.load(f)
        
        # Format the new data
        print("Formatting source data...")
        formatted_source_data = format_json(new_data)
        
        # Write formatted source data to a temporary file for reference
        print(f"Writing formatted source data to temporary file: {formatted_source_file}")
        with open(formatted_source_file, 'w', encoding='utf-8') as f:
            json.dump(formatted_source_data, f, indent=2, ensure_ascii=False)
        
        # Extract centers indexed by branch_code
        print("Extracting centers by branch_code...")
        old_centers = extract_centers_by_branch_code(old_data)
        new_centers = extract_centers_by_branch_code(new_data)
        
        print(f"Found {len(old_centers)} centers in old file")
        print(f"Found {len(new_centers)} centers in new file")
        
        # Compare the centers
        print("Comparing centers by branch_code...")
        comparison_results = compare_centers(old_centers, new_centers)
        
        # Categorize results for summary
        added = [result for result in comparison_results if result['ChangeType'] == 'Added']
        deleted = [result for result in comparison_results if result['ChangeType'] == 'Deleted']
        modified = [result for result in comparison_results if result['ChangeType'] == 'Modified']
        
        # Write comparison results to CSV
        print(f"Writing comparison results to: {comparison_file}")
        with open(comparison_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=[
                'ChangeType', 'branch_code', 'FieldName', 'OldValue', 'NewValue'
            ])
            writer.writeheader()
            
            # Write all results
            for result in comparison_results:
                writer.writerow(result)
        
        # Copy the formatted source data to the target file (unless --no-update is specified)
        if not args.no_update:
            print(f"Copying formatted data to target file: {old_file}")
            with open(old_file, 'w', encoding='utf-8') as f:
                json.dump(formatted_source_data, f, indent=2, ensure_ascii=False)
        
        # Print summary
        added_branches = len(set([result['branch_code'] for result in added]))
        deleted_branches = len(set([result['branch_code'] for result in deleted]))
        modified_branches = len(set([result['branch_code'] for result in modified]))
        
        print(f"Comparison completed successfully.")
        print(f"Added branches: {added_branches}")
        print(f"Deleted branches: {deleted_branches}")
        print(f"Modified branches: {modified_branches}")
        print(f"Total field modifications: {len(modified)}")
        print(f"Results saved to {comparison_file}")
        
        if not args.no_update:
            print(f"Source file has been formatted and copied to {old_file}")
        
    except Exception as e:
        error_message = f"Error: {str(e)}"
        print(error_message, file=sys.stderr)
        
        # Try to write error to a log file
        try:
            backup_dir = ensure_backup_dir()
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            error_file = os.path.join(backup_dir, f"error_{timestamp}.log")
            with open(error_file, 'w', encoding='utf-8') as f:
                f.write(f"Timestamp: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                f.write(f"Error: {str(e)}\n")
            print(f"Error details written to: {error_file}", file=sys.stderr)
        except Exception as e2:
            print(f"Failed to write error log: {str(e2)}", file=sys.stderr)
        
        sys.exit(1)

if __name__ == "__main__":
    main() 