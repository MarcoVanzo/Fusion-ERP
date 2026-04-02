import pandas as pd
import numpy as np
import sys
import json
from datetime import timedelta

class ValdProcessor:
    def __init__(self, rolling_window_days=28):
        self.rolling_window_days = rolling_window_days
        self.z_score_thresholds = {
            'green': 0.75,
            'yellow': 1.5,
            'red': 1.5
        }

    def clean_force_decks_csv(self, file_path):
        """
        ForceDecks CSVs often have metadata rows. 
        Detect the header row and clean the data.
        """
        # Read the file to find the header row
        with open(file_path, 'r', encoding='utf-8-sig') as f:
            lines = f.readlines()
        
        header_idx = 0
        for i, line in enumerate(lines[:20]):
            # Try to find a row that contains common headers
            if 'Athlete' in line and 'Test Date' in line:
                header_idx = i
                break
        
        df = pd.read_csv(file_path, skiprows=header_idx)
        
        # Remove empty rows or system rows
        df = df.dropna(subset=['Athlete', 'Test Date', 'Test Type'])
        
        # Convert Test Date to datetime
        df['Test Date'] = pd.to_datetime(df['Test Date'])
        
        return df

    def aggregate_trials(self, df):
        """
        Aggregate trials for each athlete/day/test.
        Mean for Readiness metrics, Max for Performance metrics.
        """
        metrics_performance = [
            'Body Mass (kg)', 
            'Jump Height (Imp-Mom) (cm)', 
            'Concentric Peak Power / BM (W/kg)', 
            'Peak Vertical Force (N)', 
            'Net Impulse (N s)', 
            'RFD (N/s)'
        ]
        
        metrics_readiness = [
            'RSI-modified',
            'RSI',
            'Eccentric Peak Force Asymmetry (%)',
            'Concentric Peak Force Asymmetry (%)',
            'Eccentric Duration (ms)',
            'Concentric Duration (ms)'
        ]
        
        # Check which metrics are present in the dataframe
        perf_cols = [c for c in metrics_performance if c in df.columns]
        readi_cols = [c for c in metrics_readiness if c in df.columns]
        
        # Group by Athlete, Date, Test Type
        # We assume 'Test Date' is normalized to the day for aggregation if needed, 
        # but usually trials are within minutes.
        df['Date_Day'] = df['Test Date'].dt.date
        
        # Performance aggregation (MAX)
        perf_agg = df.groupby(['Athlete', 'Date_Day', 'Test Type'])[perf_cols].max().reset_index()
        
        # Readiness aggregation (MEAN)
        readi_agg = df.groupby(['Athlete', 'Date_Day', 'Test Type'])[readi_cols].mean().reset_index()
        
        # Merge back
        final_df = pd.merge(perf_agg, readi_agg, on=['Athlete', 'Date_Day', 'Test Type'])
        
        return final_df

    def calculate_rolling_stats(self, df):
        """
        Calculate individual rolling baseline (28 days).
        Exclude outliers (Z-score > 2.5).
        """
        result_dfs = []
        
        for athlete, athlete_df in df.groupby('Athlete'):
            athlete_df = athlete_df.sort_values('Date_Day')
            
            # For each metric, calculate rolling mean and std
            target_metrics = [c for c in df.columns if c not in ['Athlete', 'Date_Day', 'Test Type']]
            
            for metric in target_metrics:
                # 1. Calculate historical stats (excluding today)
                # We use a 28-day window of *data points* or *calendar days*? 
                # The user says "basata sugli ultimi 28 giorni di test".
                # We'll use calendar days window if possible, or last N points.
                # Here we'll use a expanding window or rolling window with offset if available.
                
                # First, identify outliers globally for this athlete to clean the baseline?
                # "Escludi gli outlier statistici (Z-score > 2.5 o < -2.5) prima di calcolare la baseline."
                metric_mean = athlete_df[metric].mean()
                metric_std = athlete_df[metric].std()
                
                if metric_std > 0:
                    z_scores = (athlete_df[metric] - metric_mean) / metric_std
                    clean_mask = (z_scores > -2.5) & (z_scores < 2.5)
                else:
                    clean_mask = [True] * len(athlete_df)
                
                # Rolling stats on cleaned data
                temp_df = athlete_df.copy()
                temp_df.loc[~clean_mask, metric] = np.nan
                
                # Rolling window of 28 days
                # Convert Date_Day to datetime for rolling with offset
                temp_df['Date_Day_DT'] = pd.to_datetime(temp_df['Date_Day'])
                temp_df = temp_df.set_index('Date_Day_DT')
                
                baseline_mean = temp_df[metric].rolling('28D', closed='left').mean()
                baseline_std = temp_df[metric].rolling('28D', closed='left').std()
                
                athlete_df[f'{metric}_baseline_mean'] = baseline_mean.values
                athlete_df[f'{metric}_baseline_std'] = baseline_std.values
            
            result_dfs.append(athlete_df)
            
        return pd.concat(result_dfs)

    def apply_traffic_lights(self, df):
        """
        Apply traffic light system based on Z-score.
        """
        # Red: Calo RSI > 1.5 SD OR Incremento Asimmetria > 1.5 SD
        # Yellow: 0.75 - 1.5 SD
        # Green: < 0.75 SD
        
        def get_status(current, baseline_mean, baseline_std, metric_name):
            if pd.isna(baseline_mean) or pd.isna(baseline_std) or baseline_std == 0:
                return 'GRAY', 0
            
            z = (current - baseline_mean) / baseline_std
            abs_z = abs(z)
            
            # Detect directionality: for RSI, decrease is bad. For Asymmetry, increase is bad.
            is_bad = False
            if 'RSI' in metric_name and z < 0:
                is_bad = True
            elif 'Asymmetry' in metric_name and z > 0:
                is_bad = True
            elif 'Duration' in metric_name and z > 0: # Slower is bad for fatigue
                is_bad = True
            
            if not is_bad:
                return 'GREEN', z
            
            if abs_z > 1.5:
                return 'RED', z
            if abs_z > 0.75:
                return 'YELLOW', z
            return 'GREEN', z

        # Metrics for Readiness
        readiness_metrics = [
            'RSI-modified', 'RSI', 
            'Eccentric Peak Force Asymmetry (%)', 
            'Concentric Peak Force Asymmetry (%)',
            'Eccentric Duration (ms)'
        ]
        
        for metric in readiness_metrics:
            if metric in df.columns:
                statuses = []
                zs = []
                for idx, row in df.iterrows():
                    status, z = get_status(row[metric], row[f'{metric}_baseline_mean'], row[f'{metric}_baseline_std'], metric)
                    statuses.append(status)
                    zs.append(z)
                df[f'{metric}_status'] = statuses
                df[f'{metric}_zscore'] = zs

        return df

    def detect_strategy_shift(self, df):
        """
        Movement Strategy Shift Alert: 
        Today's JH Green but Eccentric Duration Red/Yellow.
        """
        jh_col = 'Jump Height (Imp-Mom) (cm)'
        ecc_dur_col = 'Eccentric Duration (ms)'
        
        if jh_col in df.columns and ecc_dur_col in df.columns:
            # We need JH status too. Let's calculate it if not present.
            # But JH is Performance, usually monitored for growth.
            # However, for strategy shift, we compare today's JH to its 28d baseline.
            
            alerts = []
            for idx, row in df.iterrows():
                jh_status, jh_z = self._get_status_for_metric(row, jh_col)
                ecc_status, ecc_z = self._get_status_for_metric(row, ecc_dur_col)
                
                if jh_status == 'GREEN' and ecc_status in ['RED', 'YELLOW']:
                    alerts.append("L'atleta sta compensando temporalmente per mantenere l'output balistico")
                else:
                    alerts.append(None)
            df['Strategy_Shift_Alert'] = alerts
            
        return df

    def _get_status_for_metric(self, row, metric):
        current = row[metric]
        baseline_mean = row[f'{metric}_baseline_mean']
        baseline_std = row[f'{metric}_baseline_std']
        
        if pd.isna(baseline_mean) or pd.isna(baseline_std) or baseline_std == 0:
            return 'GRAY', 0
        
        z = (current - baseline_mean) / baseline_std
        abs_z = abs(z)
        
        # Logic for bad/good depends on metric
        is_bad = False
        if 'Jump Height' in metric and z < 0: is_bad = True
        elif 'Duration' in metric and z > 0: is_bad = True
        
        if not is_bad: return 'GREEN', z
        if abs_z > 1.5: return 'RED', z
        if abs_z > 0.75: return 'YELLOW', z
        return 'GREEN', z

    def process_csv(self, file_path):
        """
        Full pipeline.
        """
        df = self.clean_force_decks_csv(file_path)
        df_agg = self.aggregate_trials(df)
        df_stats = self.calculate_rolling_stats(df_agg)
        df_lights = self.apply_traffic_lights(df_stats)
        df_final = self.detect_strategy_shift(df_lights)
        
        return df_final

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 ValdProcessor.py <csv_file_path>")
        sys.exit(1)
        
    processor = ValdProcessor()
    try:
        results = processor.process_csv(sys.argv[1])
        # Export as JSON for the PHP backend
        print(results.to_json(orient='records', date_format='iso'))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
