# EzEdit.co Testing Guide

## Overview

This guide provides comprehensive testing strategies, procedures, and scripts for the EzEdit.co platform. It covers unit tests, integration tests, end-to-end tests, and manual testing procedures.

## Testing Philosophy

### Test Pyramid Strategy
```
    /\
   /  \    E2E Tests (Few, Slow, Expensive)
  /____\
 /      \
/________\  Integration Tests (Some, Medium, Moderate)
/__________\
|          | Unit Tests (Many, Fast, Cheap)
|__________|
```

### Testing Principles
1. **Test Early and Often** - Run tests on every commit
2. **Fail Fast** - Catch issues as early as possible
3. **Test Real Scenarios** - Use actual FTP servers and file operations
4. **Isolate Dependencies** - Mock external services when appropriate
5. **Document Test Cases** - Clear test descriptions and expected outcomes

## Test Environment Setup

### Development Environment
```bash
# Install dependencies
npm install --dev

# Install PHP testing tools
composer require --dev phpunit/phpunit
composer require --dev mockery/mockery

# Install Cypress for E2E testing
npm install --save-dev cypress

# Set up test database
createdb ezedit_test
```

### Test Configuration Files

#### PHPUnit Configuration (`phpunit.xml`)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<phpunit bootstrap="tests/bootstrap.php"
         colors="true"
         convertErrorsToExceptions="true"
         convertNoticesToExceptions="true"
         convertWarningsToExceptions="true"
         processIsolation="false"
         stopOnFailure="false">
    
    <testsuites>
        <testsuite name="Unit">
            <directory suffix="Test.php">./tests/Unit</directory>
        </testsuite>
        <testsuite name="Integration">
            <directory suffix="Test.php">./tests/Integration</directory>
        </testsuite>
    </testsuites>
    
    <filter>
        <whitelist processUncoveredFilesFromWhitelist="true">
            <directory suffix=".php">./app</directory>
            <directory suffix=".php">./public</directory>
        </whitelist>
    </filter>
</phpunit>
```

#### Cypress Configuration (`cypress.json`)
```json
{
    "baseUrl": "http://localhost:8080",
    "viewportWidth": 1280,
    "viewportHeight": 720,
    "video": false,
    "screenshotOnRunFailure": true,
    "env": {
        "TEST_USER_EMAIL": "test@ezedit.co",
        "TEST_USER_PASSWORD": "testpassword123",
        "TEST_FTP_HOST": "test.rebex.net",
        "TEST_FTP_USER": "demo",
        "TEST_FTP_PASS": "password"
    }
}
```

## Unit Tests

### FTP Handler Tests

#### Test File: `tests/Unit/FTPHandlerTest.php`
```php
<?php

use PHPUnit\Framework\TestCase;
use Mockery;

class FTPHandlerTest extends TestCase {
    private $ftpHandler;
    private $mockConnection;
    
    protected function setUp(): void {
        $this->ftpHandler = new FTPHandler();
        $this->mockConnection = Mockery::mock('resource');
    }
    
    protected function tearDown(): void {
        Mockery::close();
    }
    
    public function testConnectSuccess() {
        // Mock successful FTP connection
        $params = [
            'host' => 'test.rebex.net',
            'port' => 21,
            'username' => 'demo',
            'password' => 'password'
        ];
        
        $result = $this->ftpHandler->connect($params);
        
        $this->assertTrue($result['success']);
        $this->assertNotEmpty($result['data']['connection_id']);
    }
    
    public function testConnectInvalidHost() {
        $params = [
            'host' => 'invalid.host.that.does.not.exist',
            'port' => 21,
            'username' => 'demo',
            'password' => 'password'
        ];
        
        $result = $this->ftpHandler->connect($params);
        
        $this->assertFalse($result['success']);
        $this->assertEquals('CONNECTION_FAILED', $result['error']['code']);
    }
    
    public function testListDirectory() {
        // Set up mock connection
        $_SESSION['ftp_connections']['test_conn'] = $this->mockConnection;
        
        $result = $this->ftpHandler->listDirectory('test_conn', '/');
        
        $this->assertTrue($result['success']);
        $this->assertIsArray($result['data']);
    }
    
    public function testGetFileContent() {
        $_SESSION['ftp_connections']['test_conn'] = $this->mockConnection;
        
        $result = $this->ftpHandler->getFile('test_conn', '/readme.txt');
        
        $this->assertTrue($result['success']);
        $this->assertNotEmpty($result['data']['content']);
    }
    
    public function testUploadFile() {
        $_SESSION['ftp_connections']['test_conn'] = $this->mockConnection;
        
        $params = [
            'path' => '/test_upload.txt',
            'content' => 'Test file content',
            'encoding' => 'utf-8'
        ];
        
        $result = $this->ftpHandler->putFile('test_conn', $params);
        
        $this->assertTrue($result['success']);
        $this->assertGreaterThan(0, $result['data']['bytes_written']);
    }
    
    public function testCreateDirectory() {
        $_SESSION['ftp_connections']['test_conn'] = $this->mockConnection;
        
        $result = $this->ftpHandler->createDirectory('test_conn', '/test_folder');
        
        $this->assertTrue($result['success']);
        $this->assertEquals('/test_folder', $result['data']['path']);
    }
    
    public function testDeleteFile() {
        $_SESSION['ftp_connections']['test_conn'] = $this->mockConnection;
        
        $result = $this->ftpHandler->deleteItem('test_conn', '/test_file.txt');
        
        $this->assertTrue($result['success']);
    }
    
    public function testRenameFile() {
        $_SESSION['ftp_connections']['test_conn'] = $this->mockConnection;
        
        $params = [
            'old_path' => '/old_name.txt',
            'new_path' => '/new_name.txt'
        ];
        
        $result = $this->ftpHandler->renameItem('test_conn', $params);
        
        $this->assertTrue($result['success']);
    }
}
```

### Authentication Tests

#### Test File: `tests/Unit/AuthControllerTest.php`
```php
<?php

use PHPUnit\Framework\TestCase;

class AuthControllerTest extends TestCase {
    private $authController;
    
    protected function setUp(): void {
        $this->authController = new AuthController();
    }
    
    public function testLoginSuccess() {
        $_POST = [
            'email' => 'test@ezedit.co',
            'password' => 'testpassword123'
        ];
        
        $result = $this->authController->login();
        
        $this->assertTrue($result['success']);
        $this->assertNotEmpty($result['data']['user']['id']);
        $this->assertNotEmpty($_SESSION['user']);
    }
    
    public function testLoginInvalidCredentials() {
        $_POST = [
            'email' => 'test@ezedit.co',
            'password' => 'wrongpassword'
        ];
        
        $result = $this->authController->login();
        
        $this->assertFalse($result['success']);
        $this->assertEquals('INVALID_CREDENTIALS', $result['error']['code']);
    }
    
    public function testLogout() {
        $_SESSION['user'] = ['id' => 'test_user_id'];
        
        $result = $this->authController->logout();
        
        $this->assertTrue($result['success']);
        $this->assertEmpty($_SESSION['user']);
    }
    
    public function testRegisterNewUser() {
        $_POST = [
            'email' => 'newuser@ezedit.co',
            'password' => 'newpassword123',
            'full_name' => 'New User'
        ];
        
        $result = $this->authController->register();
        
        $this->assertTrue($result['success']);
        $this->assertEquals('newuser@ezedit.co', $result['data']['user']['email']);
    }
}
```

### Monaco Editor Tests

#### Test File: `tests/Unit/MonacoEditorTest.js`
```javascript
// Jest configuration for JavaScript unit tests
describe('Monaco Editor Integration', () => {
    let editor;
    let container;
    
    beforeEach(() => {
        container = document.createElement('div');
        container.id = 'editor-container';
        document.body.appendChild(container);
        
        // Mock Monaco Editor
        global.monaco = {
            editor: {
                createDiffEditor: jest.fn().mockReturnValue({
                    setModel: jest.fn(),
                    getModel: jest.fn(),
                    getValue: jest.fn(),
                    setValue: jest.fn(),
                    onDidChangeModelContent: jest.fn()
                })
            }
        };
        
        editor = new MonacoEditorWrapper(container);
    });
    
    afterEach(() => {
        document.body.removeChild(container);
    });
    
    test('should initialize diff editor', async () => {
        await editor.initialize();
        
        expect(monaco.editor.createDiffEditor).toHaveBeenCalledWith(
            container,
            expect.objectContaining({
                enableSplitViewResizing: true,
                renderSideBySide: true
            })
        );
    });
    
    test('should detect language from filename', () => {
        const testCases = [
            { filename: 'index.html', expected: 'html' },
            { filename: 'style.css', expected: 'css' },
            { filename: 'script.js', expected: 'javascript' },
            { filename: 'config.php', expected: 'php' },
            { filename: 'data.json', expected: 'json' }
        ];
        
        testCases.forEach(({ filename, expected }) => {
            expect(LanguageDetector.detectLanguage(filename)).toBe(expected);
        });
    });
    
    test('should handle file content loading', async () => {
        const mockFileContent = '<!DOCTYPE html>\n<html><body></body></html>';
        const mockFtpService = {
            getFile: jest.fn().mockResolvedValue({
                success: true,
                data: { content: mockFileContent }
            })
        };
        
        await editor.loadFile('/index.html', mockFtpService);
        
        expect(mockFtpService.getFile).toHaveBeenCalledWith('/index.html');
    });
});
```

## Integration Tests

### FTP File Operations Integration

#### Test File: `tests/Integration/FTPFileOperationsTest.php`
```php
<?php

use PHPUnit\Framework\TestCase;

class FTPFileOperationsTest extends TestCase {
    private $ftpHandler;
    private $testConnectionId;
    
    protected function setUp(): void {
        $this->ftpHandler = new FTPHandler();
        
        // Connect to test FTP server
        $result = $this->ftpHandler->connect([
            'host' => $_ENV['TEST_FTP_HOST'],
            'username' => $_ENV['TEST_FTP_USER'],
            'password' => $_ENV['TEST_FTP_PASS'],
            'port' => 21
        ]);
        
        $this->testConnectionId = $result['data']['connection_id'];
    }
    
    protected function tearDown(): void {
        // Clean up test files
        $this->ftpHandler->deleteItem($this->testConnectionId, '/test_file.txt');
        $this->ftpHandler->deleteItem($this->testConnectionId, '/test_folder');
        
        // Disconnect
        $this->ftpHandler->disconnect($this->testConnectionId);
    }
    
    public function testCompleteFileLifecycle() {
        $testContent = "This is a test file\nCreated by automated tests\n";
        $testPath = '/test_file.txt';
        
        // Create file
        $createResult = $this->ftpHandler->putFile($this->testConnectionId, [
            'path' => $testPath,
            'content' => $testContent,
            'encoding' => 'utf-8'
        ]);
        
        $this->assertTrue($createResult['success']);
        
        // Verify file exists in directory listing
        $listResult = $this->ftpHandler->listDirectory($this->testConnectionId, '/');
        $this->assertTrue($listResult['success']);
        
        $fileExists = false;
        foreach ($listResult['data']['items'] as $item) {
            if ($item['name'] === 'test_file.txt') {
                $fileExists = true;
                break;
            }
        }
        $this->assertTrue($fileExists);
        
        // Read file content
        $getResult = $this->ftpHandler->getFile($this->testConnectionId, $testPath);
        $this->assertTrue($getResult['success']);
        $this->assertEquals($testContent, $getResult['data']['content']);
        
        // Update file content
        $updatedContent = $testContent . "Updated content\n";
        $updateResult = $this->ftpHandler->putFile($this->testConnectionId, [
            'path' => $testPath,
            'content' => $updatedContent,
            'encoding' => 'utf-8'
        ]);
        
        $this->assertTrue($updateResult['success']);
        
        // Verify updated content
        $getUpdatedResult = $this->ftpHandler->getFile($this->testConnectionId, $testPath);
        $this->assertEquals($updatedContent, $getUpdatedResult['data']['content']);
        
        // Rename file
        $renameResult = $this->ftpHandler->renameItem($this->testConnectionId, [
            'old_path' => $testPath,
            'new_path' => '/renamed_test_file.txt'
        ]);
        
        $this->assertTrue($renameResult['success']);
        
        // Verify renamed file exists
        $getRenamedResult = $this->ftpHandler->getFile($this->testConnectionId, '/renamed_test_file.txt');
        $this->assertTrue($getRenamedResult['success']);
        
        // Delete file
        $deleteResult = $this->ftpHandler->deleteItem($this->testConnectionId, '/renamed_test_file.txt');
        $this->assertTrue($deleteResult['success']);
    }
    
    public function testDirectoryOperations() {
        $testDir = '/test_folder';
        
        // Create directory
        $createResult = $this->ftpHandler->createDirectory($this->testConnectionId, $testDir);
        $this->assertTrue($createResult['success']);
        
        // Verify directory exists
        $listResult = $this->ftpHandler->listDirectory($this->testConnectionId, '/');
        $dirExists = false;
        foreach ($listResult['data']['items'] as $item) {
            if ($item['name'] === 'test_folder' && $item['type'] === 'directory') {
                $dirExists = true;
                break;
            }
        }
        $this->assertTrue($dirExists);
        
        // Create file in directory
        $fileInDirResult = $this->ftpHandler->putFile($this->testConnectionId, [
            'path' => $testDir . '/file_in_folder.txt',
            'content' => 'File inside test folder',
            'encoding' => 'utf-8'
        ]);
        $this->assertTrue($fileInDirResult['success']);
        
        // List directory contents
        $dirListResult = $this->ftpHandler->listDirectory($this->testConnectionId, $testDir);
        $this->assertTrue($dirListResult['success']);
        $this->assertCount(1, $dirListResult['data']['items']);
        $this->assertEquals('file_in_folder.txt', $dirListResult['data']['items'][0]['name']);
        
        // Delete file in directory
        $deleteFileResult = $this->ftpHandler->deleteItem($this->testConnectionId, $testDir . '/file_in_folder.txt');
        $this->assertTrue($deleteFileResult['success']);
        
        // Delete directory
        $deleteDirResult = $this->ftpHandler->deleteItem($this->testConnectionId, $testDir);
        $this->assertTrue($deleteDirResult['success']);
    }
}
```

### API Integration Tests

#### Test File: `tests/Integration/APIIntegrationTest.php`
```php
<?php

use PHPUnit\Framework\TestCase;
use GuzzleHttp\Client;

class APIIntegrationTest extends TestCase {
    private $client;
    private $baseUrl;
    private $authToken;
    
    protected function setUp(): void {
        $this->baseUrl = $_ENV['API_BASE_URL'] ?? 'http://localhost:8080';
        $this->client = new Client(['base_uri' => $this->baseUrl]);
        
        // Authenticate for tests
        $this->authenticate();
    }
    
    private function authenticate() {
        $response = $this->client->post('/api/auth/login', [
            'json' => [
                'email' => $_ENV['TEST_USER_EMAIL'],
                'password' => $_ENV['TEST_USER_PASSWORD']
            ]
        ]);
        
        $data = json_decode($response->getBody(), true);
        $this->authToken = $data['data']['session']['access_token'];
    }
    
    public function testAuthenticationFlow() {
        // Login
        $loginResponse = $this->client->post('/api/auth/login', [
            'json' => [
                'email' => $_ENV['TEST_USER_EMAIL'],
                'password' => $_ENV['TEST_USER_PASSWORD']
            ]
        ]);
        
        $this->assertEquals(200, $loginResponse->getStatusCode());
        $loginData = json_decode($loginResponse->getBody(), true);
        $this->assertTrue($loginData['success']);
        $this->assertNotEmpty($loginData['data']['session']['access_token']);
        
        // Get user profile
        $profileResponse = $this->client->get('/api/auth/me', [
            'headers' => [
                'Authorization' => 'Bearer ' . $loginData['data']['session']['access_token']
            ]
        ]);
        
        $this->assertEquals(200, $profileResponse->getStatusCode());
        $profileData = json_decode($profileResponse->getBody(), true);
        $this->assertTrue($profileData['success']);
        $this->assertEquals($_ENV['TEST_USER_EMAIL'], $profileData['data']['user']['email']);
        
        // Logout
        $logoutResponse = $this->client->post('/api/auth/logout', [
            'headers' => [
                'Authorization' => 'Bearer ' . $loginData['data']['session']['access_token']
            ]
        ]);
        
        $this->assertEquals(200, $logoutResponse->getStatusCode());
    }
    
    public function testFTPConnectionAPI() {
        // Connect to FTP
        $connectResponse = $this->client->post('/ftp/ftp-handler.php?action=connect', [
            'form_params' => [
                'host' => $_ENV['TEST_FTP_HOST'],
                'username' => $_ENV['TEST_FTP_USER'],
                'password' => $_ENV['TEST_FTP_PASS'],
                'port' => 21
            ],
            'headers' => [
                'Authorization' => 'Bearer ' . $this->authToken
            ]
        ]);
        
        $this->assertEquals(200, $connectResponse->getStatusCode());
        $connectData = json_decode($connectResponse->getBody(), true);
        $this->assertTrue($connectData['success']);
        
        $connectionId = $connectData['data']['connection_id'];
        
        // List directory
        $listResponse = $this->client->get('/ftp/ftp-handler.php', [
            'query' => [
                'action' => 'list',
                'connection_id' => $connectionId,
                'path' => '/'
            ],
            'headers' => [
                'Authorization' => 'Bearer ' . $this->authToken
            ]
        ]);
        
        $this->assertEquals(200, $listResponse->getStatusCode());
        $listData = json_decode($listResponse->getBody(), true);
        $this->assertTrue($listData['success']);
        $this->assertIsArray($listData['data']['items']);
        
        // Disconnect
        $disconnectResponse = $this->client->post('/ftp/ftp-handler.php?action=disconnect', [
            'form_params' => [
                'connection_id' => $connectionId
            ],
            'headers' => [
                'Authorization' => 'Bearer ' . $this->authToken
            ]
        ]);
        
        $this->assertEquals(200, $disconnectResponse->getStatusCode());
    }
}
```

## End-to-End Tests

### Cypress E2E Tests

#### Test File: `cypress/e2e/editor_workflow.cy.js`
```javascript
describe('Complete Editor Workflow', () => {
    beforeEach(() => {
        // Login before each test
        cy.visit('/auth/login');
        cy.get('[data-cy=email-input]').type(Cypress.env('TEST_USER_EMAIL'));
        cy.get('[data-cy=password-input]').type(Cypress.env('TEST_USER_PASSWORD'));
        cy.get('[data-cy=login-button]').click();
        
        // Wait for redirect to editor
        cy.url().should('include', '/editor');
    });
    
    it('should complete full FTP file editing workflow', () => {
        // Open FTP connection dialog
        cy.get('[data-cy=ftp-connect-button]').click();
        cy.get('[data-cy=ftp-connection-modal]').should('be.visible');
        
        // Fill in FTP connection details
        cy.get('[data-cy=ftp-host-input]').type(Cypress.env('TEST_FTP_HOST'));
        cy.get('[data-cy=ftp-username-input]').type(Cypress.env('TEST_FTP_USER'));
        cy.get('[data-cy=ftp-password-input]').type(Cypress.env('TEST_FTP_PASS'));
        cy.get('[data-cy=ftp-port-input]').clear().type('21');
        
        // Connect to FTP server
        cy.get('[data-cy=connect-button]').click();
        cy.get('[data-cy=connection-success-message]').should('be.visible');
        cy.get('[data-cy=ftp-connection-modal]').should('not.exist');
        
        // Verify file explorer shows files
        cy.get('[data-cy=file-explorer]').should('be.visible');
        cy.get('[data-cy=file-item]').should('have.length.greaterThan', 0);
        
        // Find and open readme.txt file
        cy.get('[data-cy=file-item]').contains('readme.txt').dblclick();
        
        // Verify Monaco editor loads
        cy.get('.monaco-editor').should('be.visible');
        cy.get('.original-editor').should('be.visible');
        cy.get('.modified-editor').should('be.visible');
        
        // Wait for file content to load
        cy.get('.original-editor .view-lines').should('not.be.empty');
        
        // Make changes to the file
        cy.get('.modified-editor .view-lines').click();
        cy.get('.modified-editor textarea').type('\n// Test comment added by Cypress', { force: true });
        
        // Verify changes are detected
        cy.get('[data-cy=unsaved-changes-indicator]').should('be.visible');
        
        // Save the file
        cy.get('[data-cy=save-file-button]').click();
        cy.get('[data-cy=save-success-message]').should('be.visible');
        cy.get('[data-cy=unsaved-changes-indicator]').should('not.exist');
        
        // Verify file was saved by refreshing and checking content
        cy.reload();
        cy.get('[data-cy=file-item]').contains('readme.txt').dblclick();
        cy.get('.original-editor .view-lines').should('contain', '// Test comment added by Cypress');
    });
    
    it('should handle file upload via drag and drop', () => {
        // Connect to FTP first (reuse connection helper)
        cy.connectToFTP();
        
        // Create test file content
        const testContent = 'This is a test file created by Cypress';
        const fileName = 'cypress_test_file.txt';
        
        // Simulate file upload via drag and drop
        cy.get('[data-cy=file-explorer]').selectFile({
            contents: Cypress.Buffer.from(testContent),
            fileName: fileName,
            mimeType: 'text/plain'
        }, { action: 'drag-drop' });
        
        // Verify upload success
        cy.get('[data-cy=upload-success-message]').should('be.visible');
        cy.get('[data-cy=file-item]').contains(fileName).should('exist');
        
        // Open uploaded file to verify content
        cy.get('[data-cy=file-item]').contains(fileName).dblclick();
        cy.get('.original-editor .view-lines').should('contain', testContent);
        
        // Clean up - delete test file
        cy.get('[data-cy=file-item]').contains(fileName).rightclick();
        cy.get('[data-cy=context-menu-delete]').click();
        cy.get('[data-cy=confirm-delete-button]').click();
        cy.get('[data-cy=delete-success-message]').should('be.visible');
    });
    
    it('should integrate with AI assistant', () => {
        cy.connectToFTP();
        
        // Open a JavaScript file
        cy.get('[data-cy=file-item]').contains('.js').first().dblclick();
        cy.get('.monaco-editor').should('be.visible');
        
        // Open AI assistant panel
        cy.get('[data-cy=ai-assistant-toggle]').click();
        cy.get('[data-cy=ai-assistant-panel]').should('be.visible');
        
        // Ask AI to explain the code
        cy.get('[data-cy=ai-prompt-input]').type('Explain this JavaScript code');
        cy.get('[data-cy=ai-send-button]').click();
        
        // Verify AI response
        cy.get('[data-cy=ai-response]').should('be.visible');
        cy.get('[data-cy=ai-response]').should('contain', 'JavaScript');
        
        // Ask AI to generate code
        cy.get('[data-cy=ai-prompt-input]').clear().type('Generate a function to validate email addresses');
        cy.get('[data-cy=ai-send-button]').click();
        
        // Verify code suggestion
        cy.get('[data-cy=ai-response]').should('contain', 'function');
        cy.get('[data-cy=ai-response]').should('contain', 'email');
        
        // Apply AI suggestion to editor
        cy.get('[data-cy=apply-ai-suggestion]').click();
        cy.get('.modified-editor .view-lines').should('contain', 'function');
    });
    
    it('should handle connection errors gracefully', () => {
        // Attempt to connect with invalid credentials
        cy.get('[data-cy=ftp-connect-button]').click();
        cy.get('[data-cy=ftp-host-input]').type('invalid.host.that.does.not.exist');
        cy.get('[data-cy=ftp-username-input]').type('invalid_user');
        cy.get('[data-cy=ftp-password-input]').type('invalid_password');
        cy.get('[data-cy=connect-button]').click();
        
        // Verify error message is displayed
        cy.get('[data-cy=connection-error-message]').should('be.visible');
        cy.get('[data-cy=connection-error-message]').should('contain', 'Connection failed');
        
        // Verify user can retry with correct credentials
        cy.get('[data-cy=ftp-host-input]').clear().type(Cypress.env('TEST_FTP_HOST'));
        cy.get('[data-cy=ftp-username-input]').clear().type(Cypress.env('TEST_FTP_USER'));
        cy.get('[data-cy=ftp-password-input]').clear().type(Cypress.env('TEST_FTP_PASS'));
        cy.get('[data-cy=connect-button]').click();
        
        cy.get('[data-cy=connection-success-message]').should('be.visible');
    });
});
```

#### Cypress Support Commands (`cypress/support/commands.js`)
```javascript
// Custom commands for reusable test actions

Cypress.Commands.add('connectToFTP', () => {
    cy.get('[data-cy=ftp-connect-button]').click();
    cy.get('[data-cy=ftp-host-input]').type(Cypress.env('TEST_FTP_HOST'));
    cy.get('[data-cy=ftp-username-input]').type(Cypress.env('TEST_FTP_USER'));
    cy.get('[data-cy=ftp-password-input]').type(Cypress.env('TEST_FTP_PASS'));
    cy.get('[data-cy=connect-button]').click();
    cy.get('[data-cy=connection-success-message]').should('be.visible');
});

Cypress.Commands.add('createTestFile', (filename, content) => {
    // Upload a test file via API
    cy.request({
        method: 'POST',
        url: '/ftp/ftp-handler.php?action=put',
        form: true,
        body: {
            connection_id: Cypress.env('TEST_CONNECTION_ID'),
            path: `/${filename}`,
            content: content,
            encoding: 'utf-8'
        }
    }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
    });
});

Cypress.Commands.add('cleanupTestFiles', () => {
    // Clean up any test files created during tests
    const testFiles = ['cypress_test_file.txt', 'test_upload.txt'];
    
    testFiles.forEach(filename => {
        cy.request({
            method: 'POST',
            url: '/ftp/ftp-handler.php?action=delete',
            form: true,
            body: {
                connection_id: Cypress.env('TEST_CONNECTION_ID'),
                path: `/${filename}`
            },
            failOnStatusCode: false
        });
    });
});
```

## Performance Tests

### Load Testing with K6

#### Test File: `tests/performance/load_test.js`
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

export const options = {
    stages: [
        { duration: '30s', target: 10 },  // Ramp up to 10 users
        { duration: '1m', target: 50 },   // Ramp up to 50 users
        { duration: '2m', target: 50 },   // Stay at 50 users
        { duration: '30s', target: 0 },   // Ramp down to 0 users
    ],
    thresholds: {
        http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
        http_req_failed: ['rate<0.1'],     // Error rate under 10%
    },
};

const errorRate = new Rate('errors');

export default function () {
    const baseUrl = 'https://ezedit.co';
    
    // Test homepage load
    let response = http.get(`${baseUrl}/`);
    check(response, {
        'homepage status is 200': (r) => r.status === 200,
        'homepage loads in <2s': (r) => r.timings.duration < 2000,
    }) || errorRate.add(1);
    
    sleep(1);
    
    // Test editor page load
    response = http.get(`${baseUrl}/editor`);
    check(response, {
        'editor status is 200': (r) => r.status === 200,
        'editor loads in <3s': (r) => r.timings.duration < 3000,
    }) || errorRate.add(1);
    
    sleep(2);
    
    // Test API authentication
    const authPayload = JSON.stringify({
        email: 'loadtest@ezedit.co',
        password: 'loadtestpassword'
    });
    
    response = http.post(`${baseUrl}/api/auth/login`, authPayload, {
        headers: {
            'Content-Type': 'application/json',
        },
    });
    
    check(response, {
        'auth status is 200': (r) => r.status === 200,
        'auth response in <1s': (r) => r.timings.duration < 1000,
    }) || errorRate.add(1);
    
    sleep(1);
}
```

### Browser Performance Testing

#### Test File: `tests/performance/lighthouse_test.js`
```javascript
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

async function runLighthouseTest() {
    const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
    const options = {
        logLevel: 'info',
        output: 'json',
        onlyCategories: ['performance', 'accessibility', 'best-practices'],
        port: chrome.port,
    };
    
    const runnerResult = await lighthouse('https://ezedit.co', options);
    await chrome.kill();
    
    // Extract scores
    const scores = runnerResult.lhr.categories;
    const performance = scores.performance.score * 100;
    const accessibility = scores.accessibility.score * 100;
    const bestPractices = scores['best-practices'].score * 100;
    
    console.log('Lighthouse Scores:');
    console.log(`Performance: ${performance}`);
    console.log(`Accessibility: ${accessibility}`);
    console.log(`Best Practices: ${bestPractices}`);
    
    // Assert minimum scores
    if (performance < 80) {
        throw new Error(`Performance score ${performance} below threshold of 80`);
    }
    if (accessibility < 90) {
        throw new Error(`Accessibility score ${accessibility} below threshold of 90`);
    }
    if (bestPractices < 85) {
        throw new Error(`Best Practices score ${bestPractices} below threshold of 85`);
    }
    
    console.log('All Lighthouse tests passed!');
}

runLighthouseTest().catch(console.error);
```

## Manual Testing Procedures

### Pre-Release Testing Checklist

#### Authentication & User Management
- [ ] User registration with email verification
- [ ] Login with email/password
- [ ] Google OAuth login
- [ ] Password reset functionality
- [ ] Session persistence across browser tabs
- [ ] Logout functionality
- [ ] Profile management (name, preferences)
- [ ] Subscription status display

#### FTP Connection Management
- [ ] Connect to various FTP servers (different hosts/ports)
- [ ] Save FTP connection profiles
- [ ] Edit existing connection details
- [ ] Delete connection profiles
- [ ] Handle connection timeouts gracefully
- [ ] Reconnect after network interruption
- [ ] Support for passive/active mode

#### File Operations
- [ ] Browse directory tree with lazy loading
- [ ] Open files in Monaco editor
- [ ] Edit files with syntax highlighting
- [ ] Save files back to FTP server
- [ ] Create new files
- [ ] Upload files via drag & drop
- [ ] Download files to local machine
- [ ] Rename files and directories
- [ ] Delete files and directories
- [ ] Copy/move files between directories

#### Monaco Editor Features
- [ ] Syntax highlighting for all supported languages
- [ ] Code folding and unfolding
- [ ] Find and replace functionality
- [ ] Multi-cursor editing
- [ ] IntelliSense auto-completion
- [ ] Diff view showing changes
- [ ] Theme switching (light/dark)
- [ ] Font size adjustment
- [ ] Line numbers and minimap

#### AI Assistant (Klein)
- [ ] Ask questions about code
- [ ] Get code explanations
- [ ] Generate code from descriptions
- [ ] Receive optimization suggestions
- [ ] Context awareness of current file
- [ ] Conversation history
- [ ] Apply AI suggestions to editor
- [ ] Token usage tracking

#### Error Handling & Edge Cases
- [ ] Network connection lost during editing
- [ ] FTP server becomes unavailable
- [ ] File permissions prevent saving
- [ ] Large file handling (>1MB)
- [ ] Binary file detection and handling
- [ ] Invalid file paths/names
- [ ] Concurrent editing detection
- [ ] Browser tab refresh with unsaved changes

#### Performance & Responsiveness
- [ ] Page load time under 3 seconds
- [ ] File open time under 1 second
- [ ] Smooth scrolling in large files
- [ ] Responsive design on tablet devices
- [ ] Memory usage with multiple files open
- [ ] CPU usage during AI operations

#### Security Testing
- [ ] XSS prevention in file content
- [ ] CSRF protection on forms
- [ ] SQL injection in search queries
- [ ] FTP credential encryption
- [ ] Session hijacking prevention
- [ ] Rate limiting on API endpoints

### Browser Compatibility Testing

#### Supported Browsers
- [ ] Chrome 90+ (Windows, macOS, Linux)
- [ ] Firefox 88+ (Windows, macOS, Linux)
- [ ] Safari 14+ (macOS, iOS)
- [ ] Edge 90+ (Windows)

#### Mobile Testing
- [ ] iPad Pro (Safari)
- [ ] iPad Air (Safari)
- [ ] Android tablets (Chrome)
- [ ] Touch interactions for file operations
- [ ] Virtual keyboard handling in editor

## Test Data Management

### Test FTP Server Setup
```bash
# Docker container for local FTP testing
docker run -d \
    --name test-ftp \
    -p 21:21 \
    -p 21000-21010:21000-21010 \
    -e USERS="testuser|testpass" \
    -e ADDRESS=localhost \
    delfer/alpine-ftp-server
```

### Test User Accounts
```json
{
    "test_users": [
        {
            "email": "free.user@ezedit.co",
            "password": "testpass123",
            "subscription": "free_trial"
        },
        {
            "email": "pro.user@ezedit.co", 
            "password": "testpass123",
            "subscription": "pro"
        },
        {
            "email": "lifetime.user@ezedit.co",
            "password": "testpass123", 
            "subscription": "lifetime"
        }
    ]
}
```

### Sample Test Files
```
test-files/
├── simple.html          # Basic HTML file
├── complex.js           # JavaScript with multiple functions
├── large.css            # CSS file >100KB
├── binary.jpg           # Binary file for upload testing
├── unicode.txt          # File with special characters
├── empty.txt            # Empty file
└── readonly.txt         # File with restricted permissions
```

## Continuous Integration

### GitHub Actions Workflow (`.github/workflows/test.yml`)
```yaml
name: Test Suite

on:
    push:
        branches: [main, develop]
    pull_request:
        branches: [main]

jobs:
    unit-tests:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v3
            
            - name: Setup PHP
              uses: shivammathur/setup-php@v2
              with:
                  php-version: '8.2'
                  extensions: ftp, pdo_pgsql
                  
            - name: Install PHP dependencies
              run: composer install --no-dev --optimize-autoloader
              
            - name: Run PHPUnit tests
              run: vendor/bin/phpunit
              
    integration-tests:
        runs-on: ubuntu-latest
        services:
            postgres:
                image: postgres:15
                env:
                    POSTGRES_PASSWORD: testpass
                    POSTGRES_DB: ezedit_test
                options: >-
                    --health-cmd pg_isready
                    --health-interval 10s
                    --health-timeout 5s
                    --health-retries 5
        steps:
            - uses: actions/checkout@v3
            
            - name: Setup test environment
              run: |
                  cp .env.testing .env
                  php artisan migrate --force
                  
            - name: Run integration tests
              run: vendor/bin/phpunit --testsuite=Integration
              
    e2e-tests:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v3
            
            - name: Setup Node.js
              uses: actions/setup-node@v3
              with:
                  node-version: '18'
                  
            - name: Install dependencies
              run: npm ci
              
            - name: Start test server
              run: npm run dev &
              
            - name: Wait for server
              run: npx wait-on http://localhost:8080
              
            - name: Run Cypress tests
              uses: cypress-io/github-action@v5
              with:
                  start: npm run dev
                  wait-on: 'http://localhost:8080'
```

## Test Reporting

### Coverage Reports
```bash
# Generate PHP coverage report
vendor/bin/phpunit --coverage-html coverage/

# Generate JavaScript coverage report  
npm run test:coverage

# Combined coverage report
npm run coverage:merge
```

### Test Results Dashboard
Integration with tools like:
- **CodeClimate** - Code quality and test coverage
- **Sentry** - Error tracking and performance monitoring
- **Lighthouse CI** - Performance regression detection
- **Percy** - Visual regression testing

## Troubleshooting Tests

### Common Test Failures

#### FTP Connection Issues
```php
// Debug FTP connection problems
if (!function_exists('ftp_connect')) {
    throw new Exception('PHP FTP extension not installed');
}

$conn = ftp_connect('test.rebex.net', 21, 10);
if (!$conn) {
    $error = error_get_last();
    throw new Exception("FTP connection failed: " . $error['message']);
}
```

#### Monaco Editor Not Loading
```javascript
// Check if Monaco CDN is accessible
const monacoScript = document.createElement('script');
monacoScript.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.36.1/min/vs/loader.js';
monacoScript.onerror = () => {
    console.error('Monaco Editor CDN not accessible');
    // Fall back to local copy
    loadLocalMonaco();
};
```

#### Database Connection Issues
```bash
# Check database connection
pg_isready -h localhost -p 5432 -U postgres

# Reset test database
dropdb ezedit_test
createdb ezedit_test
psql ezedit_test < schema.sql
```

## Conclusion

This testing guide provides comprehensive coverage for the EzEdit.co platform. Regular execution of these tests ensures:

1. **Reliability** - Catch regressions before they reach production
2. **Performance** - Monitor and maintain system speed
3. **Security** - Protect against vulnerabilities
4. **User Experience** - Ensure consistent functionality across browsers
5. **Maintainability** - Keep codebase healthy and extensible

For questions about testing procedures or to report test-related issues, please contact the development team or create an issue in the project repository.