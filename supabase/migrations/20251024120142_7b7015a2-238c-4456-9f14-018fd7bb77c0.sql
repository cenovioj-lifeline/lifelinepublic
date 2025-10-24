-- Create user_requests table
CREATE TABLE public.user_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL DEFAULT 'lifeline_collection',
  request_details TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  related_id UUID,
  related_type TEXT
);

-- Enable RLS on user_requests
ALTER TABLE public.user_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_requests
CREATE POLICY "Users can view their own requests"
  ON public.user_requests
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own requests"
  ON public.user_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins and editors can view all requests"
  ON public.user_requests
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'editor'::user_role));

CREATE POLICY "Admins and editors can update requests"
  ON public.user_requests
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'editor'::user_role));

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can create notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'editor'::user_role));

-- Add trigger for updated_at on user_requests
CREATE TRIGGER update_user_requests_updated_at
  BEFORE UPDATE ON public.user_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_user_requests_user_id ON public.user_requests(user_id);
CREATE INDEX idx_user_requests_status ON public.user_requests(status);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);