export interface SendMessageParams {
  toPhone: string;
  recipientName?: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface SendTemplateParams {
  toPhone: string;
  recipientName?: string;
  templateId: string;
  variables: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface SendMessageResult {
  success: boolean;
  provider: string;
  providerMessageId?: string;
  directUrl?: string; // e.g. wa.me link for direct dispatch
  error?: string;
}

export interface MessagingProvider {
  name: string;
  sendMessage(params: SendMessageParams): Promise<SendMessageResult>;
  sendTemplate(params: SendTemplateParams): Promise<SendMessageResult>;
  getDeliveryStatus(providerMessageId: string): Promise<string>;
}

/**
 * Normalizes Indonesian phone number to international format:
 * e.g. '08123456789' -> '628123456789'
 */
export function normalizeIndonesianPhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1);
  } else if (!cleaned.startsWith("62")) {
    cleaned = "62" + cleaned;
  }
  return cleaned;
}

/**
 * Direct WhatsApp Provider:
 * Generates direct wa.me link for seamless browser/mobile WhatsApp dispatch.
 */
export class DirectWhatsAppProvider implements MessagingProvider {
  name = "direct";

  async sendMessage(params: SendMessageParams): Promise<SendMessageResult> {
    const normalizedPhone = normalizeIndonesianPhone(params.toPhone);
    const encodedText = encodeURIComponent(params.message);
    const directUrl = `https://wa.me/${normalizedPhone}?text=${encodedText}`;

    return {
      success: true,
      provider: this.name,
      providerMessageId: `DIR-${Date.now()}`,
      directUrl,
    };
  }

  async sendTemplate(params: SendTemplateParams): Promise<SendMessageResult> {
    let text = `Pemberitahuan untuk ${params.recipientName || "Penyewa"}`;
    return this.sendMessage({
      toPhone: params.toPhone,
      recipientName: params.recipientName,
      message: text,
      metadata: params.metadata,
    });
  }

  async getDeliveryStatus(): Promise<string> {
    return "delivered";
  }
}

/**
 * Mock Provider for testing and fallback
 */
export class MockMessagingProvider implements MessagingProvider {
  name = "mock";

  async sendMessage(params: SendMessageParams): Promise<SendMessageResult> {
    return {
      success: true,
      provider: this.name,
      providerMessageId: `MOCK-${Date.now()}`,
    };
  }

  async sendTemplate(params: SendTemplateParams): Promise<SendMessageResult> {
    return {
      success: true,
      provider: this.name,
      providerMessageId: `MOCK-TPL-${Date.now()}`,
    };
  }

  async getDeliveryStatus(): Promise<string> {
    return "delivered";
  }
}

/**
 * Fonnte WhatsApp Gateway Provider (if token is configured in env or organization)
 */
export class FonnteWhatsAppProvider implements MessagingProvider {
  name = "fonnte";
  private apiToken?: string;

  constructor(apiToken?: string) {
    this.apiToken = apiToken || process.env.FONNTE_API_TOKEN;
  }

  async sendMessage(params: SendMessageParams): Promise<SendMessageResult> {
    if (!this.apiToken) {
      // Fallback to direct wa.me if token not configured
      const direct = new DirectWhatsAppProvider();
      return direct.sendMessage(params);
    }

    try {
      const normalizedPhone = normalizeIndonesianPhone(params.toPhone);
      const res = await fetch("https://api.fonnte.com/send", {
        method: "POST",
        headers: {
          Authorization: this.apiToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          target: normalizedPhone,
          message: params.message,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.status === false) {
        throw new Error(data.reason || "Fonnte API error");
      }

      return {
        success: true,
        provider: this.name,
        providerMessageId: data.id?.[0] || `FNT-${Date.now()}`,
      };
    } catch (err: any) {
      return {
        success: false,
        provider: this.name,
        error: err.message,
      };
    }
  }

  async sendTemplate(params: SendTemplateParams): Promise<SendMessageResult> {
    return this.sendMessage({
      toPhone: params.toPhone,
      recipientName: params.recipientName,
      message: params.metadata?.renderedMessage || "",
      metadata: params.metadata,
    });
  }

  async getDeliveryStatus(): Promise<string> {
    return "delivered";
  }
}

export function getMessagingProvider(providerName = "direct"): MessagingProvider {
  switch (providerName.toLowerCase()) {
    case "fonnte":
      return new FonnteWhatsAppProvider();
    case "mock":
      return new MockMessagingProvider();
    case "direct":
    default:
      return new DirectWhatsAppProvider();
  }
}
