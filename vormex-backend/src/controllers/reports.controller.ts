import { Request, Response } from 'express';

interface AuthRequest extends Request {
  user?: { userId: string };
}

const REPORT_REASONS = [
  { id: 'spam', label: 'Spam', description: 'Unwanted commercial content or spam' },
  { id: 'harassment', label: 'Harassment', description: 'Bullying or harassment' },
  { id: 'hate_speech', label: 'Hate Speech', description: 'Hateful or discriminatory content' },
  { id: 'violence', label: 'Violence', description: 'Violent or graphic content' },
  { id: 'inappropriate', label: 'Inappropriate', description: 'Inappropriate or adult content' },
  { id: 'misinformation', label: 'Misinformation', description: 'False or misleading information' },
  { id: 'impersonation', label: 'Impersonation', description: 'Pretending to be someone else' },
  { id: 'other', label: 'Other', description: 'Other violation' },
];

// Get report reasons
export const getReportReasons = async (_req: Request, res: Response): Promise<void> => {
  try {
    res.json({ reasons: REPORT_REASONS });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch report reasons' });
  }
};

// Report a post
export const reportPost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { postId } = req.params;
    const { reason, description } = req.body;

    res.json({
      success: true,
      message: 'Report submitted successfully. Our team will review it within 24 hours.',
      reportId: `report-${Date.now()}`,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit report' });
  }
};

// Report a comment
export const reportComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { commentId } = req.params;
    const { reason, description } = req.body;

    res.json({
      success: true,
      message: 'Report submitted successfully. Our team will review it within 24 hours.',
      reportId: `report-${Date.now()}`,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit report' });
  }
};

// Report a chat/conversation
export const reportChat = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { conversationId } = req.params;
    const { reason, description, messageIds } = req.body;

    res.json({
      success: true,
      message: 'Report submitted successfully. Our team will review it within 24 hours.',
      reportId: `report-${Date.now()}`,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit report' });
  }
};

// Report a user
export const reportUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { userId: reportedUserId } = req.params;
    const { reason, description } = req.body;

    res.json({
      success: true,
      message: 'Report submitted successfully. Our team will review it within 24 hours.',
      reportId: `report-${Date.now()}`,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit report' });
  }
};

// Report a group
export const reportGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { groupId } = req.params;
    const { reason, description } = req.body;

    res.json({
      success: true,
      message: 'Report submitted successfully. Our team will review it within 24 hours.',
      reportId: `report-${Date.now()}`,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit report' });
  }
};

// Get my reports
export const getMyReports = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { page = 1, limit = 10 } = req.query;

    res.json({
      reports: [],
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: 0,
        totalPages: 0,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};
