import * as soap from 'soap';

export type StandardResponse<T = unknown> = {
  success: boolean;
  cod_error: string;
  message_error: string;
  data: T;
};

export class SoapClient {
  private client: any;

  constructor(
    private wsdlUrl: string,
    private apiKey?: string,
  ) {}

  private async ensure() {
    if (!this.client) {
      const endpoint = process.env.SOAP_ENDPOINT; 

      console.log('[SOAP client] WSDL:', this.wsdlUrl, 'endpoint override:', endpoint ?? '(none)');

      this.client = await soap.createClientAsync(this.wsdlUrl, endpoint ? { endpoint } : undefined);
      if (this.apiKey) this.client.addHttpHeader('X-API-KEY', this.apiKey);
      if (endpoint) this.client.setEndpoint(endpoint); 
    }
  }

  async call<T = unknown>(method: string, args: Record<string, unknown>): Promise<StandardResponse<T>> {
    await this.ensure();
    const fn = this.client[`${method}Async`] as (a: unknown) => Promise<[StandardResponse<T>]>;
    const [result] = await fn(args);
    return result;
  }
}