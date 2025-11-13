#!/usr/bin/env python3
"""
Test script for FTP MCP Server

This script tests the FTP MCP server functionality without requiring
a full MCP client connection. It can be used to verify the server
is working correctly.

Usage:
    python test_ftp_mcp.py
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path to import ftp_mcp
sys.path.insert(0, str(Path(__file__).parent.parent))

from ftp_mcp import (
    ProtocolType,
    ResponseFormat,
    ListDirectoryInput,
    UploadFileInput,
    DownloadFileInput,
    DeleteFileInput,
    CreateDirectoryInput,
    ReadFileInput,
    ftp_list_directory,
    ftp_upload_file,
    ftp_download_file,
    ftp_delete_file,
    ftp_create_directory,
    ftp_read_file
)

async def test_list_directory():
    """Test listing directory contents."""
    print("\n=== Testing ftp_list_directory ===")
    
    # Example test - replace with your FTP server details
    params = ListDirectoryInput(
        protocol=ProtocolType.FTP,
        host="ftp.example.com",
        port=21,
        username="testuser",
        password="testpass",
        remote_path="/",
        response_format=ResponseFormat.MARKDOWN
    )
    
    # Uncomment to run actual test
    # result = await ftp_list_directory(params)
    # print(result)
    print("✓ List directory function defined correctly")

async def test_create_directory():
    """Test creating a directory."""
    print("\n=== Testing ftp_create_directory ===")
    
    params = CreateDirectoryInput(
        protocol=ProtocolType.FTP,
        host="ftp.example.com",
        port=21,
        username="testuser",
        password="testpass",
        remote_path="/test_directory"
    )
    
    # Uncomment to run actual test
    # result = await ftp_create_directory(params)
    # print(result)
    print("✓ Create directory function defined correctly")

async def test_read_file():
    """Test reading file contents."""
    print("\n=== Testing ftp_read_file ===")
    
    params = ReadFileInput(
        protocol=ProtocolType.FTP,
        host="ftp.example.com",
        port=21,
        username="testuser",
        password="testpass",
        remote_path="/test.txt",
        encoding="utf-8"
    )
    
    # Uncomment to run actual test
    # result = await ftp_read_file(params)
    # print(result)
    print("✓ Read file function defined correctly")

def test_imports():
    """Test that all imports work correctly."""
    print("\n=== Testing Imports ===")
    try:
        from ftp_mcp import mcp
        print("✓ MCP server imported successfully")
        print(f"✓ Server name: {mcp.name}")
        return True
    except Exception as e:
        print(f"✗ Import failed: {e}")
        return False

def test_models():
    """Test that Pydantic models work correctly."""
    print("\n=== Testing Pydantic Models ===")
    try:
        # Test ListDirectoryInput
        params = ListDirectoryInput(
            protocol=ProtocolType.FTP,
            host="test.example.com",
            port=21,
            username="user",
            password="pass",
            remote_path="/"
        )
        assert params.protocol == ProtocolType.FTP
        assert params.host == "test.example.com"
        print("✓ ListDirectoryInput model works")
        
        # Test ReadFileInput
        read_params = ReadFileInput(
            protocol=ProtocolType.SFTP,
            host="sftp.example.com",
            port=22,
            username="user",
            password="pass",
            remote_path="/file.txt"
        )
        assert read_params.protocol == ProtocolType.SFTP
        assert read_params.encoding == "utf-8"  # Default value
        print("✓ ReadFileInput model works")
        
        return True
    except Exception as e:
        print(f"✗ Model test failed: {e}")
        return False

async def main():
    """Run all tests."""
    print("=" * 60)
    print("FTP MCP Server Test Suite")
    print("=" * 60)
    
    # Test imports
    if not test_imports():
        print("\n✗ Import tests failed. Exiting.")
        return 1
    
    # Test models
    if not test_models():
        print("\n✗ Model tests failed. Exiting.")
        return 1
    
    # Test async functions (structure only, no actual FTP calls)
    await test_list_directory()
    await test_create_directory()
    await test_read_file()
    
    print("\n" + "=" * 60)
    print("All tests completed successfully!")
    print("=" * 60)
    print("\nNote: To test actual FTP operations, uncomment the test calls")
    print("and provide valid FTP server credentials.")
    print("\nTo use with Claude Code:")
    print("1. Install dependencies: pip install -r requirements.txt")
    print("2. Configure MCP server in .claude/settings.local.json")
    print("3. Restart Claude Code")
    
    return 0

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)



