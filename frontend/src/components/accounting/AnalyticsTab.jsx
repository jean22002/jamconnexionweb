import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, MapPin, Building2, Award, Loader2, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const AnalyticsTab = ({ token }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/musicians/me/analytics`, {
        params: { year },
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error(error.response?.data?.detail || 'Erreur lors du chargement des analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  const getComparisonIcon = (value) => {
    if (value > 5) return <ArrowUp className="w-4 h-4 text-green-400" />;
    if (value < -5) return <ArrowDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-yellow-400" />;
  };

  const getComparisonColor = (value) => {
    if (value > 5) return 'text-green-400';
    if (value < -5) return 'text-red-400';
    return 'text-yellow-400';
  };

  if (loading) {
    return (
      <div className="glassmorphism rounded-2xl p-6">
        <div className="text-center py-12">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
          <p className="text-muted-foreground">Chargement des analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const { summary, monthly_data, top_cities, top_venues, industry_comparison } = analytics;

  return (
    <div className="space-y-6">
      {/* Header avec filtre année */}
      <div className="glassmorphism rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading font-semibold text-2xl flex items-center gap-2">
            <Award className="w-6 h-6 text-primary" />
            Analytics PRO
          </h2>
          <Select value={year.toString()} onValueChange={(val) => setYear(parseInt(val))}>
            <SelectTrigger className="w-32 rounded-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2025, 2024, 2023, 2022].map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-sm text-muted-foreground">Revenus totaux</p>
            </div>
            <p className="text-3xl font-bold text-green-400">{summary.total_revenue.toFixed(0)}€</p>
            {summary.growth_rate !== 0 && (
              <div className={`flex items-center gap-1 text-sm mt-2 ${getComparisonColor(summary.growth_rate)}`}>
                {summary.growth_rate > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span>{Math.abs(summary.growth_rate).toFixed(1)}% vs {year - 1}</span>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-primary/10 to-cyan-500/5 border border-primary/20 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Concerts payés</p>
            </div>
            <p className="text-3xl font-bold text-primary">{summary.total_concerts}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Moyenne industrie: {industry_comparison.avg_concerts.toFixed(1)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-yellow-400" />
              </div>
              <p className="text-sm text-muted-foreground">Cachet moyen</p>
            </div>
            <p className="text-3xl font-bold text-yellow-400">{summary.avg_cachet.toFixed(0)}€</p>
            <p className="text-xs text-muted-foreground mt-2">
              Min: {summary.min_cachet.toFixed(0)}€ • Max: {summary.max_cachet.toFixed(0)}€
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Award className="w-5 h-5 text-purple-400" />
              </div>
              <p className="text-sm text-muted-foreground">Performance</p>
            </div>
            <div className={`text-2xl font-bold ${getComparisonColor(industry_comparison.revenue_vs_industry)}`}>
              {industry_comparison.revenue_vs_industry > 0 ? '+' : ''}
              {industry_comparison.revenue_vs_industry.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-2">vs moyenne PRO</p>
          </div>
        </div>

        {/* Comparaison avec l'industrie */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Comparaison avec les autres musiciens PRO
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Revenus</p>
                <p className="font-semibold">{summary.total_revenue.toFixed(0)}€</p>
              </div>
              <div className={`flex items-center gap-1 ${getComparisonColor(industry_comparison.revenue_vs_industry)}`}>
                {getComparisonIcon(industry_comparison.revenue_vs_industry)}
                <span className="text-sm font-semibold">
                  {industry_comparison.revenue_vs_industry > 0 ? '+' : ''}
                  {industry_comparison.revenue_vs_industry.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Concerts</p>
                <p className="font-semibold">{summary.total_concerts}</p>
              </div>
              <div className={`flex items-center gap-1 ${getComparisonColor(industry_comparison.concerts_vs_industry)}`}>
                {getComparisonIcon(industry_comparison.concerts_vs_industry)}
                <span className="text-sm font-semibold">
                  {industry_comparison.concerts_vs_industry > 0 ? '+' : ''}
                  {industry_comparison.concerts_vs_industry.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Cachet moyen</p>
                <p className="font-semibold">{summary.avg_cachet.toFixed(0)}€</p>
              </div>
              <div className={`flex items-center gap-1 ${getComparisonColor(industry_comparison.cachet_vs_industry)}`}>
                {getComparisonIcon(industry_comparison.cachet_vs_industry)}
                <span className="text-sm font-semibold">
                  {industry_comparison.cachet_vs_industry > 0 ? '+' : ''}
                  {industry_comparison.cachet_vs_industry.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Graphique revenus mensuels */}
      <div className="glassmorphism rounded-2xl p-6">
        <h3 className="font-semibold text-lg mb-4">Évolution des revenus {year}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthly_data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis dataKey="month_name" stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
              labelStyle={{ color: '#fff' }}
            />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={3} name="Revenus (€)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Graphique concerts mensuels */}
      <div className="glassmorphism rounded-2xl p-6">
        <h3 className="font-semibold text-lg mb-4">Nombre de concerts par mois</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthly_data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis dataKey="month_name" stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
              labelStyle={{ color: '#fff' }}
            />
            <Legend />
            <Bar dataKey="concerts" fill="#10b981" name="Concerts" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top villes et venues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top villes */}
        <div className="glassmorphism rounded-2xl p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Top 5 villes
          </h3>
          {top_cities.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucune donnée</p>
          ) : (
            <div className="space-y-3">
              {top_cities.map((city, index) => (
                <div key={`top-city-${city.city}-${index}`} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold">{city.city}</p>
                      <p className="text-xs text-muted-foreground">{city.concerts} concert(s)</p>
                    </div>
                  </div>
                  <p className="font-bold text-green-400">{city.revenue.toFixed(0)}€</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top venues */}
        <div className="glassmorphism rounded-2xl p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Top 5 établissements
          </h3>
          {top_venues.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucune donnée</p>
          ) : (
            <div className="space-y-3">
              {top_venues.map((venue, index) => (
                <div key={`top-venue-${venue.venue}-${index}`} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center font-bold text-cyan-400">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold">{venue.venue}</p>
                      <p className="text-xs text-muted-foreground">{venue.concerts} concert(s)</p>
                    </div>
                  </div>
                  <p className="font-bold text-green-400">{venue.revenue.toFixed(0)}€</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;
