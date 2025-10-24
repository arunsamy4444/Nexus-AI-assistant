import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wpjjqfmbdnlymecechwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwampxZm1iZG5seW1lY2VjaHd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNjI5OTYsImV4cCI6MjA3NjgzODk5Nn0.v4FEMhjjUw8GJp1AhpFJEmogaqBi1_3P0jx8c6bSoH0';

export const supabase = createClient(supabaseUrl, supabaseKey);
