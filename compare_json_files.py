#!/usr/bin/env python3
import json
import os
import csv
import datetime
import difflib
import sys
import copy
import shutil

def format_json(data):
    """Format JSON data with consistent indentation and sorting"""
    if isinstance(data, list):
        return sorted([format_json(item) if isinstance(item, (dict, list)) else item for item in data], 
                     key=lambda x: json.dumps(x) if isinstance(x, dict) else str(x))
    elif isinstance(data, dict):
        return {k: format_json(v) if isinstance(v, (dict, list)) else v for k, v in sorted(data.items())}
    return data

def detect_changes(source_data, target_data, path="root"):
    """
    Detect detailed changes between two JSON objects
    Returns a list of change records with path and type of change
    """
    changes = []
    
    # Different types
    if type(source_data) != type(target_data):
        changes.append({
            "path": path,
            "change_type": "type_change",
            "source_type": type(source_data).__name__,
            "target_type": type(target_data).__name__,
            "source_value": str(source_data)[:100] if not isinstance(source_data, (dict, list)) else "...",
            "target_value": str(target_data)[:100] if not isinstance(target_data, (dict, list)) else "..."
        })
        return changes
    
    if isinstance(source_data, dict):
        # Find keys that exist in source but not in target (added)
        source_keys = set(source_data.keys())
        target_keys = set(target_data.keys())
        
        for key in source_keys - target_keys:
            changes.append({
                "path": f"{path}.{key}" if path != "root" else key,
                "change_type": "key_added",
                "key": key,
                "value": str(source_data[key])[:100] if not isinstance(source_data[key], (dict, list)) else "..."
            })
        
        # Find keys that exist in target but not in source (removed)
        for key in target_keys - source_keys:
            changes.append({
                "path": f"{path}.{key}" if path != "root" else key,
                "change_type": "key_removed",
                "key": key,
                "value": str(target_data[key])[:100] if not isinstance(target_data[key], (dict, list)) else "..."
            })
        
        # Check values for keys that exist in both
        for key in source_keys & target_keys:
            new_path = f"{path}.{key}" if path != "root" else key
            changes.extend(detect_changes(source_data[key], target_data[key], new_path))
            
    elif isinstance(source_data, list):
        if len(source_data) != len(target_data):
            changes.append({
                "path": path,
                "change_type": "list_length_change",
                "source_length": len(source_data),
                "target_length": len(target_data)
            })
        
        # Compare list items
        min_length = min(len(source_data), len(target_data))
        for i in range(min_length):
            new_path = f"{path}[{i}]"
            changes.extend(detect_changes(source_data[i], target_data[i], new_path))
    
    elif source_data != target_data:
        # For primitive values, record the difference
        changes.append({
            "path": path,
            "change_type": "value_change",
            "source_value": str(source_data)[:100],
            "target_value": str(target_data)[:100]
        })
    
    return changes

def count_differences(source_data, target_data):
    """Count differences between two JSON objects"""
    if type(source_data) != type(target_data):
        return 1
    
    total_diff = 0
    
    if isinstance(source_data, dict):
        # Count keys that are in source but not in target
        source_keys = set(source_data.keys())
        target_keys = set(target_data.keys())
        added_keys = source_keys - target_keys
        removed_keys = target_keys - source_keys
        total_diff += len(added_keys) + len(removed_keys)
        
        # Count differences in values for keys that exist in both
        for key in source_keys & target_keys:
            total_diff += count_differences(source_data[key], target_data[key])
            
    elif isinstance(source_data, list):
        # This is a simplified approach - in reality, comparing lists is more complex
        # We're assuming the lists contain objects that can be compared directly
        if len(source_data) != len(target_data):
            total_diff += abs(len(source_data) - len(target_data))
        
        # Compare list contents up to the length of the shorter list
        min_length = min(len(source_data), len(target_data))
        for i in range(min_length):
            total_diff += count_differences(source_data[i], target_data[i])
    
    elif source_data != target_data:
        # For primitive values, just count if they're different
        total_diff += 1
        
    return total_diff

def summarize_changes(changes):
    """Create a summary of the changes"""
    summary = {
        "total_changes": len(changes),
        "key_added": 0,
        "key_removed": 0,
        "value_change": 0,
        "type_change": 0,
        "list_length_change": 0,
    }
    
    for change in changes:
        change_type = change.get("change_type")
        if change_type in summary:
            summary[change_type] += 1
        
    return summary

def ensure_backup_dir():
    """Ensure backup directory exists"""
    backup_dir = "backup"
    if not os.path.exists(backup_dir):
        os.makedirs(backup_dir)
    return backup_dir

def main():
    try:
        print("Starting JSON processing script...")
        
        # Define file paths
        source_file = "Centers_Raw.json"
        target_file = "Center Locatore.json"
        
        # Ensure backup directory exists
        backup_dir = ensure_backup_dir()
        
        # Generate timestamp for the statistics file
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Define file paths with backup directory
        stats_filename = f"script_{timestamp}.csv"
        changes_filename = f"changes_{timestamp}.csv"
        
        stats_file = os.path.join(backup_dir, stats_filename)
        changes_file = os.path.join(backup_dir, changes_filename)
        
        # Check if files exist
        if not os.path.exists(source_file):
            raise FileNotFoundError(f"Source file '{source_file}' not found")
        if not os.path.exists(target_file):
            print(f"Warning: Target file '{target_file}' not found. A new file will be created.")
        
        # Create a backup of the target file if it exists
        target_backup = None
        if os.path.exists(target_file):
            target_backup_filename = f"backup_{os.path.basename(target_file)}"
            target_backup = os.path.join(backup_dir, target_backup_filename)
            print(f"Creating backup of target file: {target_backup}")
            shutil.copy2(target_file, target_backup)
        
        print(f"Reading source file: {source_file}")
        with open(source_file, 'r', encoding='utf-8') as f:
            source_data = json.load(f)
        
        print("Formatting source data...")
        formatted_source_data = format_json(source_data)
        
        # Write formatted source data to a temporary file for comparison
        formatted_source_filename = f"formatted_source_{timestamp}.json"
        formatted_source_file = os.path.join(backup_dir, formatted_source_filename)
        
        print(f"Writing formatted source data to temporary file: {formatted_source_file}")
        with open(formatted_source_file, 'w', encoding='utf-8') as f:
            json.dump(formatted_source_data, f, indent=2, ensure_ascii=False)
        
        # Statistics to collect
        stats = {
            "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "source_file": source_file,
            "target_file": target_file,
            "source_file_size": os.path.getsize(source_file),
            "differences": 0,
            "status": "Success"
        }
        
        # Detailed changes list
        all_changes = []
        
        # If target file exists, compare the files
        if os.path.exists(target_file):
            print(f"Reading target file: {target_file}")
            try:
                with open(target_file, 'r', encoding='utf-8') as f:
                    target_data = json.load(f)
                
                print("Calculating differences...")
                stats["target_file_size"] = os.path.getsize(target_file)
                stats["differences"] = count_differences(formatted_source_data, target_data)
                
                print("Detecting detailed changes...")
                all_changes = detect_changes(formatted_source_data, target_data)
                
                # Add change summary to stats
                change_summary = summarize_changes(all_changes)
                stats.update(change_summary)
                
            except json.JSONDecodeError:
                print(f"Warning: Target file '{target_file}' contains invalid JSON. Proceeding with copy operation.")
                stats["status"] = "Target contained invalid JSON"
        else:
            stats["target_file_size"] = 0
            stats["differences"] = "N/A (target file did not exist)"
        
        # Copy the formatted source data to the target file
        print(f"Copying formatted data to target file: {target_file}")
        with open(target_file, 'w', encoding='utf-8') as f:
            json.dump(formatted_source_data, f, indent=2, ensure_ascii=False)
        
        # Write statistics to CSV
        print(f"Writing statistics to: {stats_file}")
        with open(stats_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(["Metric", "Value"])
            for key, value in stats.items():
                writer.writerow([key, value])
        
        # Write detailed changes to CSV
        if all_changes:
            print(f"Writing detailed changes to: {changes_file}")
            with open(changes_file, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=[
                    "path", "change_type", "key", "value", 
                    "source_value", "target_value", 
                    "source_type", "target_type",
                    "source_length", "target_length"
                ])
                writer.writeheader()
                
                # Limit to 1000 records to avoid extremely large files
                max_records = min(len(all_changes), 1000)
                for i in range(max_records):
                    writer.writerow(all_changes[i])
                
                if len(all_changes) > 1000:
                    print(f"Note: Limited detailed changes to 1000 records (out of {len(all_changes)} total)")
        
        print("Cleaning up temporary files...")
        # We keep the formatted source file in the backup directory
        
        print(f"Script completed successfully. Statistics saved to {stats_file}")
        if all_changes:
            print(f"Detailed changes saved to {changes_file}")
        print(f"Source file has been formatted and copied to {target_file}")
        
    except Exception as e:
        error_message = f"Error: {str(e)}"
        print(error_message, file=sys.stderr)
        
        # Try to write error to stats file
        try:
            backup_dir = ensure_backup_dir()
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            stats_file = os.path.join(backup_dir, f"script_error_{timestamp}.csv")
            with open(stats_file, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow(["Metric", "Value"])
                writer.writerow(["timestamp", datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")])
                writer.writerow(["status", "Error"])
                writer.writerow(["error_message", str(e)])
        except Exception as e2:
            print(f"Failed to write error statistics: {str(e2)}", file=sys.stderr)
        
        sys.exit(1)

if __name__ == "__main__":
    main() 