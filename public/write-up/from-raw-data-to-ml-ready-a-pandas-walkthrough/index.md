---
title: 'From Raw Data to ML-Ready: A Pandas Walkthrough'
date: '2026-06-09'
tags: ['pandas', 'data-science', 'feature-engineering', 'python', 'guide']
draft: false
summary: 'Full ML data prep lifecycle in Pandas: load, clean, impute, engineer features, encode, scale, and ship to model.'
---

&nbsp;

This guide walks through the full lifecycle of preparing data for machine learning using Pandas. It follows the order you'd actually work in: load it, understand it, clean it, handle what's missing, transform it, engineer features, and get it ready for a model.

---

## Pandas vs PySpark: Quick Comparison

Pandas runs in-memory on a single machine: fast for anything that fits in RAM (a few GB). PySpark distributes work across a cluster and is built for datasets too large for one machine.

| | Pandas | PySpark |
|---|---|---|
| Execution | Eager, runs immediately | Lazy, builds a plan, executes on action |
| Scale | Single machine, in-memory | Distributed cluster |
| Syntax | `df['col']`, `df.groupby()` | `F.col('col')`, `df.groupBy()` |
| Transform back to original shape | `groupby().transform()` | `Window` functions |
| Add a column | `df['new'] = ...` | `df.withColumn('new', ...)` |
| Null handling | `fillna()`, `dropna()` | Same API names, similar behavior |
| Best for | Prototyping, EDA, small-mid data | Production pipelines, big data |

Most data scientists prototype in Pandas and move to PySpark when scale demands it. The concepts transfer directly, filtering, grouping, joining, windowing, only the syntax changes.

The rest of this guide is Pandas only.

---

## Step 1: Load It Smart

How you read the data determines how much cleaning you'll need later. A lazy `read_csv()` works, but a few parameters save significant effort downstream.

```python
import pandas as pd
import numpy as np

df = pd.read_csv('data.csv',
    usecols=['id', 'age', 'salary', 'dept', 'date'],
    dtype={'dept': 'category', 'age': 'int32'},
    na_values=['', 'N/A', 'null', '-', '?'],
    parse_dates=['date']
)
```

`usecols` avoids loading columns you'll never use. `dtype` sets efficient types upfront: `category` for low-cardinality strings cuts memory dramatically. `na_values` catches common null disguises so they're already `NaN` when you start exploring. `parse_dates` saves you a `pd.to_datetime()` call later.

For files too large for memory, chunk it:

```python
chunks = pd.read_csv('huge.csv', chunksize=100_000)
df = pd.concat((chunk[chunk['value'] > 0] for chunk in chunks), ignore_index=True)
```

Other formats:

```python
df = pd.read_parquet('data.parquet')       # columnar, fast, compressed
df = pd.read_excel('data.xlsx', sheet_name='Sheet1')
df = pd.read_json('data.json')
df = pd.read_sql("SELECT * FROM users", connection)
```

---

## Step 2: Understand What You Have

Before changing anything, get a complete picture. These five lines surface most problems:

```python
df.shape                                          # how big
df.dtypes                                         # are types correct
df.isnull().mean().sort_values(ascending=False)   # % missing per column
df.describe(include='all')                        # distributions + uniques
df.duplicated().sum()                             # exact duplicate rows
```

`df.info()` gives non-null counts, dtypes, and memory in one shot. If a column you expected to be numeric shows as `object`, dirty data is hiding in it: stray strings like `"N/A"` or `"--"` that broke type inference.

Go deeper where it matters:

```python
df['col'].value_counts()                # frequency of each value
df['col'].nunique()                     # cardinality
df.corr()                               # pairwise correlation (numeric)
df.select_dtypes(include='number').skew()  # skewness
df.memory_usage(deep=True).sum() / 1e6  # total memory in MB
```

At this point you should know: which columns have nulls and how many, which columns have wrong types, whether duplicates exist, and the general distribution shape of your features.

---

## Step 3: Clean the Dirt

Cleaning comes before filling: you need to know what's actually missing vs what's just messy.

**Column names**: standardize early so nothing downstream breaks on spaces or mixed case:

```python
df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_')
```

**String inconsistencies**: the same value spelled three different ways will create three separate categories:

```python
df['status'] = df['status'].str.strip().str.lower()
df['status'] = df['status'].replace({'yes': 1, 'y': 1, 'no': 0, 'n': 0})
```

**Hidden nulls**: catch what `read_csv` didn't:

```python
df.replace(['', ' ', 'N/A', 'NA', 'null', 'None', '?', '-', '--'], np.nan, inplace=True)
```

**Fix types**: coerce bad values to NaN rather than crashing:

```python
df['price'] = pd.to_numeric(df['price'], errors='coerce')
df['date']  = pd.to_datetime(df['date'], errors='coerce')
df['dept']  = df['dept'].astype('category')
```

**Duplicates**: decide which copy to keep based on domain logic:

```python
df.duplicated(subset=['user_id', 'date']).sum()
df.drop_duplicates(subset=['user_id', 'date'], keep='last', inplace=True)
```

`keep='last'` is often right for transactional data where later records are corrections. `keep=False` drops all copies when you can't determine which is correct.

---

## Step 4: Handle Missing Data

Now that the data is clean, the remaining `NaN` values are genuinely missing. Strategy depends on how much is missing and why.

**Understand the pattern first:**

```python
missing_pct = df.isnull().mean().sort_values(ascending=False)
print(missing_pct[missing_pct > 0])
```

Columns with > 50% missing are usually worth dropping unless the missingness itself is informative. Rows missing the target variable should always be dropped.

**Drop when appropriate:**

```python
df.dropna(subset=['target'])                    # target must exist
df.drop(columns=missing_pct[missing_pct > 0.5].index)  # drop mostly-empty columns
df.dropna(thresh=len(df.columns) * 0.7)         # keep rows that are ≥70% complete
```

**Fill with simple statistics**: median is safer than mean for skewed data:

```python
df['salary'].fillna(df['salary'].median(), inplace=True)
df['category'].fillna(df['category'].mode()[0], inplace=True)
```

**Fill within groups**: much more accurate when group structure exists:

```python
df['salary'] = df.groupby('dept')['salary'].transform(lambda x: x.fillna(x.median()))
```

**Time series fills**: respect temporal order:

```python
df['value'] = df['value'].ffill()                    # carry last known value forward
df['value'] = df['value'].interpolate(method='linear')  # smooth interpolation
```

**Flag missingness before imputing**: the fact that data was missing can be predictive:

```python
df['salary_was_missing'] = df['salary'].isnull().astype(int)
# then fill salary
```

---

## Step 5: Handle Outliers

Outliers can distort means, scaling, and model training. Detect first, then decide whether to remove, cap, or transform.

**IQR method**: robust, widely used:

```python
Q1, Q3 = df['salary'].quantile([0.25, 0.75])
IQR = Q3 - Q1
lower, upper = Q1 - 1.5 * IQR, Q3 + 1.5 * IQR

outliers = df[(df['salary'] < lower) | (df['salary'] > upper)]
print(f"{len(outliers)} outliers found")
```

**Clipping** is usually better than dropping: you keep the row and limit the extreme:

```python
df['salary'] = df['salary'].clip(lower=lower, upper=upper)
```

**Log transform**: compresses right-skewed distributions and reduces outlier impact:

```python
df['salary_log'] = np.log1p(df['salary'])  # log1p handles zeros
```

---

## Step 6: Transform & Reshape

At this point the data is clean and complete. Now reshape it into the structure your model needs.

**Conditional columns**: always vectorize, never use `apply` for simple logic:

```python
df['flag'] = np.where(df['score'] >= 90, 'High', 'Low')

conditions = [df['score'] >= 90, df['score'] >= 75, df['score'] >= 60]
df['grade'] = np.select(conditions, ['A', 'B', 'C'], default='F')
```

`np.select` with multiple conditions is 10–100x faster than `apply` with a lambda.

**Binning**: converts continuous variables into categories:

```python
# Equal-width bins (domain-driven boundaries)
df['age_group'] = pd.cut(df['age'], bins=[0, 18, 35, 55, 100],
                         labels=['Teen', 'Young', 'Mid', 'Senior'])

# Equal-frequency bins (each bin has same record count)
df['income_tier'] = pd.qcut(df['income'], q=4, labels=['Q1', 'Q2', 'Q3', 'Q4'])
```

Use `cut` when the boundaries mean something (age brackets, salary bands). Use `qcut` when you want balanced groups for analysis.

**Wide to long**: when features are spread across columns:

```python
df_long = df.melt(id_vars=['name'], value_vars=['q1', 'q2', 'q3'],
                  var_name='quarter', value_name='sales')
```

**Long to wide**: for cross-tabulated summaries:

```python
pd.pivot_table(df, values='revenue', index='region', columns='quarter',
               aggfunc='sum', fill_value=0)
```

---

## Step 7: Aggregate

Aggregation creates summary features from grouped data. The distinction between `agg` and `transform` is fundamental.

**`agg`** collapses each group into one row: useful for summary tables:

```python
summary = df.groupby('dept').agg(
    avg_salary = ('salary', 'mean'),
    headcount  = ('id', 'count'),
    max_salary = ('salary', 'max'),
    salary_std = ('salary', 'std')
)
```

**`transform`** returns a value for every original row: this is what you use to enrich the original DataFrame with group-level context:

```python
df['dept_avg']    = df.groupby('dept')['salary'].transform('mean')
df['vs_dept_avg'] = df['salary'] - df['dept_avg']
df['pct_of_dept'] = df['salary'] / df.groupby('dept')['salary'].transform('sum')
df['rank_in_dept'] = df.groupby('dept')['salary'].rank(ascending=False, method='dense')
```

**Cumulative aggregations** within groups:

```python
df['running_total'] = df.groupby('dept')['sales'].cumsum()
df['cummax']        = df.groupby('dept')['sales'].cummax()
```

**Filter groups**: keep only groups that meet a condition:

```python
df = df.groupby('dept').filter(lambda x: x['salary'].mean() > 70000)
```

---

## Step 8: Engineer Features

This is where the dataset goes from clean to powerful. Good features encode domain knowledge that raw columns don't capture.

### From Dates

A single datetime column can produce many useful signals:

```python
df['month']        = df['date'].dt.month
df['dayofweek']    = df['date'].dt.dayofweek       # 0=Monday
df['is_weekend']   = df['date'].dt.dayofweek >= 5
df['quarter']      = df['date'].dt.quarter
df['is_month_end'] = df['date'].dt.is_month_end
df['day_of_year']  = df['date'].dt.dayofyear
```

### Lag & Difference (Time Series)

Let the model see recent history and momentum:

```python
df['lag_1']   = df['sales'].shift(1)
df['lag_7']   = df['sales'].shift(7)
df['diff_1']  = df['sales'].diff(1)           # absolute change
df['pct_chg'] = df['sales'].pct_change(1)     # relative change
```

### Rolling Windows

Smooth out noise and capture local trends:

```python
df['roll_mean_7'] = df['sales'].rolling(7, min_periods=1).mean()
df['roll_std_7']  = df['sales'].rolling(7, min_periods=1).std()
df['exp_max']     = df['sales'].expanding().max()
```

### Ratios & Interactions

Sometimes the relationship between two features matters more than either alone:

```python
df['price_per_sqft'] = df['price'] / df['sqft']
df['bmi']            = df['weight'] / (df['height'] / 100) ** 2
df['age_x_income']   = df['age'] * df['income']
```

### Group-Level Features

Enrich each row with where it stands relative to its group:

```python
df['dept_avg']    = df.groupby('dept')['salary'].transform('mean')
df['dept_rank']   = df.groupby('dept')['salary'].rank(pct=True)
df['vs_avg']      = df['salary'] - df['dept_avg']
df['dept_pct']    = df['salary'] / df.groupby('dept')['salary'].transform('sum')
```

### Text Features (without NLP)

Quick signals from text columns when full NLP is overkill:

```python
df['name_len']    = df['name'].str.len()
df['word_count']  = df['text'].str.split().str.len()
df['has_keyword'] = df['text'].str.contains('urgent', case=False, na=False).astype(int)
```

---

## Step 9: Encode Categoricals

Models need numbers. The encoding strategy depends on the variable type and the model.

**One-hot encoding**: for nominal categories with no order. Use `drop_first` to avoid multicollinearity in linear models:

```python
df = pd.get_dummies(df, columns=['dept', 'region'], drop_first=True)
```

**Ordinal encoding**: when the categories have a natural order:

```python
df['education'] = df['education'].map({
    'high_school': 0, 'bachelors': 1, 'masters': 2, 'phd': 3
})
```

**Frequency encoding**: replaces each category with how often it appears. Simple, effective, doesn't blow up dimensionality:

```python
df['city_freq'] = df['city'].map(df['city'].value_counts(normalize=True))
```

**Target encoding**: replaces each category with the mean target for that group. Powerful but leaks information if not done carefully. Always compute on training data and apply to both:

```python
means = df_train.groupby('city')['target'].mean()
df_train['city_enc'] = df_train['city'].map(means)
df_test['city_enc']  = df_test['city'].map(means)
```

---

## Step 10: Scale Features

Linear models, SVMs, KNN, and neural networks are sensitive to feature magnitude. Tree-based models (Random Forest, XGBoost) are not.

```python
from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler
```

- **StandardScaler**: centers to mean=0, std=1. Default for most linear models and PCA.
- **MinMaxScaler**: scales to [0, 1]. Useful for neural networks.
- **RobustScaler**: uses median and IQR instead of mean and std. Handles outliers better.

```python
scaler = StandardScaler()
df[['age', 'salary']] = scaler.fit_transform(df[['age', 'salary']])
```

Always `fit` on the training set only, then `transform` both train and test. Fitting on the full dataset leaks test information into the scaler.

---

## Step 11: Final Checks Before Modeling

Before passing data to a model, run a quick sanity check:

```python
# No nulls remaining
assert df.isnull().sum().sum() == 0, "Nulls still present"

# No infinite values
assert np.isinf(df.select_dtypes(include='number').values).sum() == 0, "Inf values found"

# No object columns left (all encoded)
assert df.select_dtypes(include='object').columns.tolist() == [], "Unencoded categoricals"

# Check for constant columns (zero variance — useless for modeling)
constant_cols = [c for c in df.select_dtypes(include='number').columns if df[c].std() == 0]
df.drop(columns=constant_cols, inplace=True)

# Check for highly correlated feature pairs (optional — remove redundancy)
corr_matrix = df.corr().abs()
upper = corr_matrix.where(np.triu(np.ones(corr_matrix.shape), k=1).astype(bool))
high_corr = [col for col in upper.columns if any(upper[col] > 0.95)]
```

Split, then you're ready:

```python
from sklearn.model_selection import train_test_split

X = df.drop(columns=['target'])
y = df['target']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
```

---

## Appendix: Common Patterns Quick Reference

**Merge two DataFrames:**

```python
pd.merge(df1, df2, on='key', how='left')
pd.merge(df1, df2, left_on='cust_id', right_on='id', how='inner')
pd.concat([df1, df2], ignore_index=True)         # stack rows
```

**String operations:**

```python
df['col'].str.strip()
df['col'].str.lower()
df['col'].str.contains('pattern', case=False, na=False)
df['col'].str.replace(r'\d+', 'NUM', regex=True)
df['col'].str.split(',', expand=True)
df['col'].str.extract(r'(\d+)')
```

**Sorting and ranking:**

```python
df.sort_values(['dept', 'salary'], ascending=[True, False])
df.nlargest(10, 'salary')
df['rank'] = df['salary'].rank(method='dense', ascending=False)
df['pct_rank'] = df['salary'].rank(pct=True)
```

**Rename and drop:**

```python
df.rename(columns={'old': 'new'}, inplace=True)
df.drop(columns=['temp1', 'temp2'], inplace=True)
```

**Save output:**

```python
df.to_csv('output.csv', index=False)
df.to_parquet('output.parquet')
```

**Memory optimization:**

```python
df['age']    = df['age'].astype('int8')
df['salary'] = df['salary'].astype('float32')
df['dept']   = df['dept'].astype('category')
```

---
