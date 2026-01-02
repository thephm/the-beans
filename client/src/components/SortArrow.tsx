import React from 'react';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

export const SortArrow: React.FC<{ direction: 'asc' | 'desc' }> = ({ direction }) => (
  direction === 'asc' ? (
    <ArrowUpwardIcon style={{ fontSize: 18, verticalAlign: 'middle', marginLeft: 4 }} />
  ) : (
    <ArrowDownwardIcon style={{ fontSize: 18, verticalAlign: 'middle', marginLeft: 4 }} />
  )
);
