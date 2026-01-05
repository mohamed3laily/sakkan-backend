import {
  parsePhoneNumber,
  isValidPhoneNumber,
  CountryCode,
} from 'libphonenumber-js';
import { BadRequestException } from '@nestjs/common';

export class PhoneUtils {
  /**
   * Validates and normalizes a phone number to E.164 format
   * @param phone - The phone number to validate
   * @param defaultCountry - Default country code if not provided in phone
   * @returns Normalized phone number in E.164 format (e.g., +201234567890)
   */
  static normalizePhone(
    phone: string,
    defaultCountry: CountryCode = 'EG',
  ): string {
    try {
      // Remove any whitespace
      const cleanedPhone = phone.trim();

      // Check if phone is valid
      if (!isValidPhoneNumber(cleanedPhone, defaultCountry)) {
        throw new BadRequestException('Invalid phone number format');
      }

      // Parse and format to E.164
      const phoneNumber = parsePhoneNumber(cleanedPhone, defaultCountry);

      if (!phoneNumber) {
        throw new BadRequestException('Unable to parse phone number');
      }

      // Return normalized E.164 format
      return phoneNumber.number;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Invalid phone number format');
    }
  }

  /**
   * Format phone number for display
   * @param phone - E.164 formatted phone number
   * @returns Formatted phone number (e.g., +20 123 456 7890)
   */
  static formatPhone(phone: string): string {
    try {
      const phoneNumber = parsePhoneNumber(phone);
      return phoneNumber ? phoneNumber.formatInternational() : phone;
    } catch {
      return phone;
    }
  }

  /**
   * Get country code from phone number
   * @param phone - E.164 formatted phone number
   * @returns Country code (e.g., 'EG')
   */
  static getCountryCode(phone: string): string | undefined {
    try {
      const phoneNumber = parsePhoneNumber(phone);
      return phoneNumber?.country;
    } catch {
      return undefined;
    }
  }

  /**
   * Validate phone number without normalization
   * @param phone - The phone number to validate
   * @param defaultCountry - Default country code
   * @returns boolean
   */
  static isValid(phone: string, defaultCountry: CountryCode = 'EG'): boolean {
    try {
      return isValidPhoneNumber(phone, defaultCountry);
    } catch {
      return false;
    }
  }
}
