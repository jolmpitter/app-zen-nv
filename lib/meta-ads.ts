import axios from 'axios';

const FACEBOOK_API_VERSION = 'v21.0';
const FACEBOOK_GRAPH_API = `https://graph.facebook.com/${FACEBOOK_API_VERSION}`;

export interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  daily_budget?: string;
  lifetime_budget?: string;
  created_time: string;
  updated_time: string;
}

export interface MetaAdSet {
  id: string;
  name: string;
  status: string;
  campaign_id: string;
  daily_budget?: string;
  lifetime_budget?: string;
  billing_event?: string;
  optimization_goal?: string;
  bid_amount?: string;
  targeting?: any;
  created_time: string;
  updated_time: string;
  start_time?: string;
  end_time?: string;
}

export interface MetaInsights {
  campaign_id?: string;
  campaign_name?: string;
  spend: number;
  impressions: number;
  clicks: number;
  reach: number;
  ctr: number;
  cpc: number;
  cpm: number;
  cpp: number;
  actions?: {
    action_type: string;
    value: string;
  }[];
  cost_per_action_type?: {
    action_type: string;
    value: string;
  }[];
  date_start: string;
  date_stop: string;
}

export interface MetaAggregatedInsights {
  total_spend: number;
  total_impressions: number;
  total_clicks: number;
  total_reach: number;
  avg_ctr: number;
  avg_cpc: number;
  avg_cpm: number;
  total_leads: number;
  total_purchases: number;
  total_conversions: number;
  roas: number;
  conversion_rate: number;
}

export class MetaAdsAPI {
  private accessToken: string;
  private adAccountId: string;

  constructor(accessToken: string, adAccountId: string) {
    this.accessToken = accessToken;
    // Garantir que o ad account ID tenha o prefixo 'act_'
    this.adAccountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
  }

  /**
   * Busca todas as campanhas da conta de anúncios
   */
  async getCampaigns(): Promise<MetaCampaign[]> {
    try {
      const response = await axios.get(
        `${FACEBOOK_GRAPH_API}/${this.adAccountId}/campaigns`,
        {
          params: {
            access_token: this.accessToken,
            fields: 'id,name,status,objective,daily_budget,lifetime_budget,created_time,updated_time',
            limit: 100,
          },
        }
      );

      return response.data?.data || [];
    } catch (error: any) {
      console.error('Erro ao buscar campanhas do Meta Ads:', error?.response?.data || error?.message);
      throw new Error(`Erro ao buscar campanhas: ${error?.response?.data?.error?.message || error?.message}`);
    }
  }

  /**
   * Busca insights (métricas) de uma campanha específica
   */
  async getCampaignInsights(
    campaignId: string,
    datePreset: string = 'last_30d'
  ): Promise<MetaInsights | null> {
    try {
      const response = await axios.get(
        `${FACEBOOK_GRAPH_API}/${campaignId}/insights`,
        {
          params: {
            access_token: this.accessToken,
            date_preset: datePreset,
            fields: 'campaign_name,spend,impressions,clicks,reach,ctr,cpc,cpm,cpp,actions,cost_per_action_type',
            time_increment: 1,
          },
        }
      );

      const data = response.data?.data;
      if (!data || data.length === 0) {
        return null;
      }

      // Agregar métricas de todos os dias
      const aggregated = this.aggregateInsights(data);
      aggregated.campaign_id = campaignId;
      
      return aggregated;
    } catch (error: any) {
      console.error(`Erro ao buscar insights da campanha ${campaignId}:`, error?.response?.data || error?.message);
      return null;
    }
  }

  /**
   * Busca insights agregados de todas as campanhas
   */
  async getAccountInsights(datePreset: string = 'last_30d'): Promise<MetaAggregatedInsights> {
    try {
      const response = await axios.get(
        `${FACEBOOK_GRAPH_API}/${this.adAccountId}/insights`,
        {
          params: {
            access_token: this.accessToken,
            date_preset: datePreset,
            fields: 'spend,impressions,clicks,reach,ctr,cpc,cpm,cpp,actions,cost_per_action_type,purchase_roas',
            time_increment: 1,
          },
        }
      );

      const data = response.data?.data || [];
      return this.calculateAggregatedMetrics(data);
    } catch (error: any) {
      console.error('Erro ao buscar insights agregados:', error?.response?.data || error?.message);
      throw new Error(`Erro ao buscar métricas: ${error?.response?.data?.error?.message || error?.message}`);
    }
  }

  /**
   * Busca insights com período customizado
   */
  async getAccountInsightsCustom(
    startDate: string, // Formato: YYYY-MM-DD
    endDate: string     // Formato: YYYY-MM-DD
  ): Promise<MetaAggregatedInsights> {
    try {
      const response = await axios.get(
        `${FACEBOOK_GRAPH_API}/${this.adAccountId}/insights`,
        {
          params: {
            access_token: this.accessToken,
            time_range: JSON.stringify({ since: startDate, until: endDate }),
            fields: 'spend,impressions,clicks,reach,ctr,cpc,cpm,cpp,actions,cost_per_action_type,purchase_roas',
            time_increment: 1,
          },
        }
      );

      const data = response.data?.data || [];
      return this.calculateAggregatedMetrics(data);
    } catch (error: any) {
      console.error('Erro ao buscar insights customizados:', error?.response?.data || error?.message);
      throw new Error(`Erro ao buscar métricas: ${error?.response?.data?.error?.message || error?.message}`);
    }
  }

  /**
   * Agrega insights de múltiplos dias em um único objeto
   */
  private aggregateInsights(insights: any[]): MetaInsights {
    const aggregated: MetaInsights = {
      spend: 0,
      impressions: 0,
      clicks: 0,
      reach: 0,
      ctr: 0,
      cpc: 0,
      cpm: 0,
      cpp: 0,
      date_start: insights[0]?.date_start || '',
      date_stop: insights[insights.length - 1]?.date_stop || '',
    };

    insights.forEach((insight) => {
      aggregated.spend += parseFloat(insight?.spend || '0');
      aggregated.impressions += parseInt(insight?.impressions || '0');
      aggregated.clicks += parseInt(insight?.clicks || '0');
      aggregated.reach += parseInt(insight?.reach || '0');
    });

    // Calcular médias
    if (aggregated.clicks > 0 && aggregated.impressions > 0) {
      aggregated.ctr = (aggregated.clicks / aggregated.impressions) * 100;
    }
    if (aggregated.clicks > 0 && aggregated.spend > 0) {
      aggregated.cpc = aggregated.spend / aggregated.clicks;
    }
    if (aggregated.impressions > 0 && aggregated.spend > 0) {
      aggregated.cpm = (aggregated.spend / aggregated.impressions) * 1000;
    }
    if (aggregated.reach > 0 && aggregated.spend > 0) {
      aggregated.cpp = (aggregated.spend / aggregated.reach) * 1000;
    }

    return aggregated;
  }

  /**
   * Calcula métricas agregadas de todos os insights
   */
  private calculateAggregatedMetrics(insights: any[]): MetaAggregatedInsights {
    const metrics: MetaAggregatedInsights = {
      total_spend: 0,
      total_impressions: 0,
      total_clicks: 0,
      total_reach: 0,
      avg_ctr: 0,
      avg_cpc: 0,
      avg_cpm: 0,
      total_leads: 0,
      total_purchases: 0,
      total_conversions: 0,
      roas: 0,
      conversion_rate: 0,
    };

    insights.forEach((insight) => {
      metrics.total_spend += parseFloat(insight?.spend || '0');
      metrics.total_impressions += parseInt(insight?.impressions || '0');
      metrics.total_clicks += parseInt(insight?.clicks || '0');
      metrics.total_reach += parseInt(insight?.reach || '0');

      // Contar leads e conversões
      const actions = insight?.actions || [];
      actions.forEach((action: any) => {
        if (action?.action_type === 'lead') {
          metrics.total_leads += parseInt(action?.value || '0');
        }
        if (action?.action_type === 'purchase' || action?.action_type === 'offsite_conversion.fb_pixel_purchase') {
          metrics.total_purchases += parseInt(action?.value || '0');
        }
        if (action?.action_type?.includes('conversion') || action?.action_type === 'omni_complete_registration') {
          metrics.total_conversions += parseInt(action?.value || '0');
        }
      });

      // ROAS (pode vir diretamente do Facebook ou calculado)
      if (insight?.purchase_roas && insight?.purchase_roas?.length > 0) {
        metrics.roas += parseFloat(insight?.purchase_roas[0]?.value || '0');
      }
    });

    // Calcular médias
    if (metrics.total_clicks > 0 && metrics.total_impressions > 0) {
      metrics.avg_ctr = (metrics.total_clicks / metrics.total_impressions) * 100;
    }
    if (metrics.total_clicks > 0 && metrics.total_spend > 0) {
      metrics.avg_cpc = metrics.total_spend / metrics.total_clicks;
    }
    if (metrics.total_impressions > 0 && metrics.total_spend > 0) {
      metrics.avg_cpm = (metrics.total_spend / metrics.total_impressions) * 1000;
    }
    if (metrics.total_clicks > 0) {
      metrics.conversion_rate = ((metrics.total_leads + metrics.total_purchases + metrics.total_conversions) / metrics.total_clicks) * 100;
    }

    // Se não temos ROAS do Facebook, calcular manualmente (assumindo valor médio)
    if (metrics.roas === 0 && metrics.total_purchases > 0 && metrics.total_spend > 0) {
      // Valor médio estimado por compra (pode ser configurável)
      const avgOrderValue = 100; // R$ 100 por compra (exemplo)
      const totalRevenue = metrics.total_purchases * avgOrderValue;
      metrics.roas = (totalRevenue / metrics.total_spend) * 100;
    }

    return metrics;
  }

  /**
   * Busca insights diários (time series) para gráficos temporais
   */
  async getTimeSeriesInsights(
    startDate?: string, // Formato: YYYY-MM-DD
    endDate?: string    // Formato: YYYY-MM-DD
  ): Promise<{
    daily_data: Array<{
      date: string;
      spend: number;
      impressions: number;
      clicks: number;
      conversions: number;
      leads: number;
      purchases: number;
    }>;
  }> {
    try {
      // Se não fornecido, usar últimos 30 dias
      const params: any = {
        access_token: this.accessToken,
        fields: 'date_start,spend,impressions,clicks,reach,actions',
        time_increment: 1, // 1 dia
        level: 'account',
      };

      if (startDate && endDate) {
        params.time_range = JSON.stringify({ since: startDate, until: endDate });
      } else {
        params.date_preset = 'last_30d';
      }

      const response = await axios.get(
        `${FACEBOOK_GRAPH_API}/${this.adAccountId}/insights`,
        { params }
      );

      const data = response.data?.data || [];

      // Processar dados diários
      const dailyData = data.map((day: any) => {
        const actions = day?.actions || [];
        let leads = 0;
        let purchases = 0;
        let conversions = 0;

        actions.forEach((action: any) => {
          if (action?.action_type === 'lead') {
            leads += parseInt(action?.value || '0');
          }
          if (action?.action_type === 'purchase' || action?.action_type === 'offsite_conversion.fb_pixel_purchase') {
            purchases += parseInt(action?.value || '0');
          }
          if (action?.action_type?.includes('conversion') || action?.action_type === 'omni_complete_registration') {
            conversions += parseInt(action?.value || '0');
          }
        });

        return {
          date: day?.date_start || '',
          spend: parseFloat(day?.spend || '0'),
          impressions: parseInt(day?.impressions || '0'),
          clicks: parseInt(day?.clicks || '0'),
          conversions: conversions,
          leads: leads,
          purchases: purchases,
        };
      });

      return { daily_data: dailyData };
    } catch (error: any) {
      console.error('Erro ao buscar time series:', error?.response?.data || error?.message);
      throw new Error(`Erro ao buscar dados temporais: ${error?.response?.data?.error?.message || error?.message}`);
    }
  }

  /**
   * Testa a conexão com a API do Facebook
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.get(
        `${FACEBOOK_GRAPH_API}/${this.adAccountId}`,
        {
          params: {
            access_token: this.accessToken,
            fields: 'id,name,account_status',
          },
        }
      );

      return {
        success: true,
        message: `Conectado à conta: ${response.data?.name || 'Desconhecido'}`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error?.response?.data?.error?.message || 'Erro ao conectar com Facebook Ads',
      };
    }
  }

  /**
   * Atualiza uma campanha (status ou orçamento)
   */
  async updateCampaign(
    campaignId: string,
    updates: { status?: string; dailyBudget?: number }
  ): Promise<any> {
    try {
      const params: any = {
        access_token: this.accessToken
      };

      if (updates.status) {
        params.status = updates.status; // ACTIVE, PAUSED, ARCHIVED
      }

      if (updates.dailyBudget) {
        params.daily_budget = Math.round(updates.dailyBudget * 100); // Converter para centavos
      }

      const response = await axios.post(
        `${FACEBOOK_GRAPH_API}/${campaignId}`,
        null,
        { params }
      );

      return response.data;
    } catch (error: any) {
      console.error('Erro ao atualizar campanha:', error?.response?.data || error?.message);
      throw new Error(`Erro ao atualizar campanha: ${error?.response?.data?.error?.message || error?.message}`);
    }
  }

  /**
   * Busca detalhes de uma campanha específica
   */
  async getCampaignDetails(campaignId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${FACEBOOK_GRAPH_API}/${campaignId}`,
        {
          params: {
            access_token: this.accessToken,
            fields: 'id,name,status,objective,daily_budget,lifetime_budget,created_time,updated_time'
          }
        }
      );

      return {
        ...response.data,
        daily_budget: response.data.daily_budget ? response.data.daily_budget / 100 : 0,
        lifetime_budget: response.data.lifetime_budget ? response.data.lifetime_budget / 100 : 0
      };
    } catch (error: any) {
      console.error('Erro ao buscar detalhes da campanha:', error?.response?.data || error?.message);
      throw new Error(`Erro ao buscar campanha: ${error?.response?.data?.error?.message || error?.message}`);
    }
  }

  /**
   * Busca conjuntos de anúncios (ad sets) de uma campanha
   */
  async getAdSets(campaignId: string): Promise<MetaAdSet[]> {
    try {
      const response = await axios.get(
        `${FACEBOOK_GRAPH_API}/${campaignId}/adsets`,
        {
          params: {
            access_token: this.accessToken,
            fields: 'id,name,status,campaign_id,daily_budget,lifetime_budget,billing_event,optimization_goal,bid_amount,targeting,created_time,updated_time,start_time,end_time',
            limit: 100
          }
        }
      );

      return response.data.data.map((adset: any) => ({
        ...adset,
        daily_budget: adset.daily_budget ? (parseFloat(adset.daily_budget) / 100).toFixed(2) : undefined,
        lifetime_budget: adset.lifetime_budget ? (parseFloat(adset.lifetime_budget) / 100).toFixed(2) : undefined,
        bid_amount: adset.bid_amount ? (parseFloat(adset.bid_amount) / 100).toFixed(2) : undefined,
      }));
    } catch (error: any) {
      console.error('Erro ao buscar ad sets:', error?.response?.data || error?.message);
      throw new Error(`Erro ao buscar ad sets: ${error?.response?.data?.error?.message || error?.message}`);
    }
  }

  /**
   * Busca detalhes de um ad set específico
   */
  async getAdSetDetails(adsetId: string): Promise<MetaAdSet> {
    try {
      const response = await axios.get(
        `${FACEBOOK_GRAPH_API}/${adsetId}`,
        {
          params: {
            access_token: this.accessToken,
            fields: 'id,name,status,campaign_id,daily_budget,lifetime_budget,billing_event,optimization_goal,bid_amount,targeting,created_time,updated_time,start_time,end_time'
          }
        }
      );

      return {
        ...response.data,
        daily_budget: response.data.daily_budget ? (parseFloat(response.data.daily_budget) / 100).toFixed(2) : undefined,
        lifetime_budget: response.data.lifetime_budget ? (parseFloat(response.data.lifetime_budget) / 100).toFixed(2) : undefined,
        bid_amount: response.data.bid_amount ? (parseFloat(response.data.bid_amount) / 100).toFixed(2) : undefined,
      };
    } catch (error: any) {
      console.error('Erro ao buscar detalhes do ad set:', error?.response?.data || error?.message);
      throw new Error(`Erro ao buscar ad set: ${error?.response?.data?.error?.message || error?.message}`);
    }
  }

  /**
   * Atualiza um ad set (status ou orçamento)
   */
  async updateAdSet(
    adsetId: string,
    updates: { status?: string; dailyBudget?: number; bidAmount?: number }
  ): Promise<any> {
    try {
      const params: any = {
        access_token: this.accessToken
      };

      if (updates.status) {
        params.status = updates.status; // ACTIVE, PAUSED, ARCHIVED
      }

      if (updates.dailyBudget !== undefined) {
        params.daily_budget = Math.round(updates.dailyBudget * 100); // Converter para centavos
      }

      if (updates.bidAmount !== undefined) {
        params.bid_amount = Math.round(updates.bidAmount * 100); // Converter para centavos
      }

      const response = await axios.post(
        `${FACEBOOK_GRAPH_API}/${adsetId}`,
        null,
        { params }
      );

      return response.data;
    } catch (error: any) {
      console.error('Erro ao atualizar ad set:', error?.response?.data || error?.message);
      throw new Error(`Erro ao atualizar ad set: ${error?.response?.data?.error?.message || error?.message}`);
    }
  }
}
