const { 
  generateRandomCode, 
  isValidEmail, 
  isStrongPassword, 
  sanitizeInput,
  formatErrorResponse,
  formatSuccessResponse
} = require('../../../src/utils/helpers');

describe('Helper Functions', () => {
  describe('generateRandomCode', () => {
    it('should generate a 6-digit code', () => {
      const code = generateRandomCode();
      expect(code).toMatch(/^\d{6}$/);
    });

    it('should generate different codes on multiple calls', () => {
      const code1 = generateRandomCode();
      const code2 = generateRandomCode();
      expect(code1).not.toBe(code2);
    });
  });

  describe('isValidEmail', () => {
    it('should return true for valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('test123@test-domain.org')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test.example.com')).toBe(false);
    });
  });

  describe('isStrongPassword', () => {
    it('should return true for strong passwords', () => {
      expect(isStrongPassword('Password123')).toBe(true);
      expect(isStrongPassword('MySecurePass1')).toBe(true);
      expect(isStrongPassword('Test@123ABC')).toBe(true);
    });

    it('should return false for weak passwords', () => {
      expect(isStrongPassword('password')).toBe(false);
      expect(isStrongPassword('PASSWORD')).toBe(false);
      expect(isStrongPassword('12345678')).toBe(false);
      expect(isStrongPassword('pass123')).toBe(false);
      expect(isStrongPassword('Password')).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('should trim whitespace', () => {
      expect(sanitizeInput('  test  ')).toBe('test');
    });

    it('should remove HTML tags', () => {
      expect(sanitizeInput('<script>alert("test")</script>')).toBe('alert("test")');
      expect(sanitizeInput('<p>Hello World</p>')).toBe('Hello World');
    });

    it('should remove angle brackets', () => {
      expect(sanitizeInput('test <> brackets')).toBe('test  brackets');
    });

    it('should return non-string inputs unchanged', () => {
      expect(sanitizeInput(123)).toBe(123);
      expect(sanitizeInput(null)).toBe(null);
      expect(sanitizeInput(undefined)).toBe(undefined);
      expect(sanitizeInput({})).toEqual({});
    });
  });

  describe('formatErrorResponse', () => {
    it('should format error response correctly', () => {
      const result = formatErrorResponse('Something went wrong');
      expect(result).toEqual({
        success: false,
        message: 'Something went wrong',
        errors: null
      });
    });

    it('should include errors when provided', () => {
      const errors = ['Field is required', 'Invalid format'];
      const result = formatErrorResponse('Validation failed', errors);
      expect(result).toEqual({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    });
  });

  describe('formatSuccessResponse', () => {
    it('should format success response correctly', () => {
      const result = formatSuccessResponse('Operation successful');
      expect(result).toEqual({
        success: true,
        message: 'Operation successful',
        data: null
      });
    });

    it('should include data when provided', () => {
      const data = { id: 1, name: 'Test' };
      const result = formatSuccessResponse('Data retrieved', data);
      expect(result).toEqual({
        success: true,
        message: 'Data retrieved',
        data: data
      });
    });
  });
});