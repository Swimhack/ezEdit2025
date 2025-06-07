/**
 * @ezedit/lib-puppeteer
 * Puppeteer utilities for ezEdit to assist with screenshots and web edits
 */

import puppeteer, { Browser, Page } from 'puppeteer';

/**
 * Configuration options for the Puppeteer browser instance
 */
export interface BrowserOptions {
  headless?: boolean;
  defaultViewport?: {
    width: number;
    height: number;
  };
  timeout?: number;
}

/**
 * Screenshot options
 */
export interface ScreenshotOptions {
  path?: string;
  fullPage?: boolean;
  selector?: string;
  quality?: number; // 0-100, JPEG only
  type?: 'png' | 'jpeg';
}

/**
 * Web edit operation types
 */
export type EditOperation = 
  | { type: 'setText'; selector: string; value: string }
  | { type: 'click'; selector: string }
  | { type: 'select'; selector: string; value: string }
  | { type: 'setAttribute'; selector: string; attribute: string; value: string }
  | { type: 'removeElement'; selector: string }
  | { type: 'addStyleTag'; content: string }
  | { type: 'addScriptTag'; content: string }
  | { type: 'evaluate'; function: string };

/**
 * Main class for Puppeteer operations
 */
export class PuppeteerService {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private defaultOptions: BrowserOptions = {
    headless: true,
    defaultViewport: { width: 1280, height: 800 },
    timeout: 30000
  };

  /**
   * Initialize the browser instance
   */
  async initialize(options: BrowserOptions = {}): Promise<void> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    
    try {
      this.browser = await puppeteer.launch({
        headless: mergedOptions.headless ? 'new' : false,
        defaultViewport: mergedOptions.defaultViewport,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      this.page = await this.browser.newPage();
      await this.page.setDefaultTimeout(mergedOptions.timeout);
      
      // Enable JavaScript on the page
      await this.page.setJavaScriptEnabled(true);
    } catch (error) {
      console.error('Failed to initialize Puppeteer:', error);
      throw error;
    }
  }

  /**
   * Navigate to a URL
   */
  async navigateTo(url: string): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }
    
    try {
      await this.page.goto(url, { waitUntil: 'networkidle2' });
    } catch (error) {
      console.error(`Failed to navigate to ${url}:`, error);
      throw error;
    }
  }

  /**
   * Take a screenshot of the current page
   */
  async takeScreenshot(options: ScreenshotOptions = {}): Promise<Buffer> {
    if (!this.page) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }
    
    try {
      if (options.selector) {
        const element = await this.page.$(options.selector);
        if (!element) {
          throw new Error(`Element with selector "${options.selector}" not found`);
        }
        
        return await element.screenshot({
          path: options.path,
          type: options.type || 'png',
          quality: options.type === 'jpeg' ? options.quality : undefined
        });
      } else {
        return await this.page.screenshot({
          path: options.path,
          fullPage: options.fullPage || false,
          type: options.type || 'png',
          quality: options.type === 'jpeg' ? options.quality : undefined
        });
      }
    } catch (error) {
      console.error('Failed to take screenshot:', error);
      throw error;
    }
  }

  /**
   * Perform a series of edit operations on the page
   */
  async performEdits(operations: EditOperation[]): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }
    
    try {
      for (const operation of operations) {
        switch (operation.type) {
          case 'setText':
            await this.page.evaluate(
              (selector, value) => {
                const element = document.querySelector(selector);
                if (element) {
                  if ('value' in element) {
                    (element as HTMLInputElement).value = value;
                  } else {
                    element.textContent = value;
                  }
                }
              },
              operation.selector,
              operation.value
            );
            break;
            
          case 'click':
            await this.page.click(operation.selector);
            break;
            
          case 'select':
            await this.page.select(operation.selector, operation.value);
            break;
            
          case 'setAttribute':
            await this.page.evaluate(
              (selector, attribute, value) => {
                const element = document.querySelector(selector);
                if (element) {
                  element.setAttribute(attribute, value);
                }
              },
              operation.selector,
              operation.attribute,
              operation.value
            );
            break;
            
          case 'removeElement':
            await this.page.evaluate(
              (selector) => {
                const element = document.querySelector(selector);
                if (element && element.parentNode) {
                  element.parentNode.removeChild(element);
                }
              },
              operation.selector
            );
            break;
            
          case 'addStyleTag':
            await this.page.addStyleTag({ content: operation.content });
            break;
            
          case 'addScriptTag':
            await this.page.addScriptTag({ content: operation.content });
            break;
            
          case 'evaluate':
            await this.page.evaluate(operation.function);
            break;
        }
      }
    } catch (error) {
      console.error('Failed to perform edits:', error);
      throw error;
    }
  }

  /**
   * Get the HTML content of the current page
   */
  async getPageContent(): Promise<string> {
    if (!this.page) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }
    
    try {
      return await this.page.content();
    } catch (error) {
      console.error('Failed to get page content:', error);
      throw error;
    }
  }

  /**
   * Extract specific content from the page using a selector
   */
  async extractContent(selector: string): Promise<string | null> {
    if (!this.page) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }
    
    try {
      return await this.page.evaluate((sel) => {
        const element = document.querySelector(sel);
        return element ? element.innerHTML : null;
      }, selector);
    } catch (error) {
      console.error(`Failed to extract content with selector "${selector}":`, error);
      throw error;
    }
  }

  /**
   * Close the browser instance
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}

// Export a singleton instance
export const puppeteerService = new PuppeteerService();

// Export default for convenience
export default puppeteerService;
