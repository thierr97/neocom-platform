import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Extend Request to include auth user
interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

// Get all tasks (filtered by role)
export const getAllTasks = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, role } = req.user!;
    const { status, type, orderId } = req.query;

    let whereClause: any = {};

    // Filter based on role
    if (role === 'STAFF_PREPA') {
      // STAFF_PREPA only sees tasks assigned to them or unassigned reception tasks
      whereClause = {
        OR: [
          { assignedToId: userId },
          {
            AND: [
              { type: 'RECEPTION_INBOUND' },
              { assignedToId: null }
            ]
          }
        ]
      };
    } else if (role === 'DELIVERY') {
      // DELIVERY only sees their assigned delivery tasks
      whereClause = {
        assignedToId: userId,
        type: { in: ['DELIVERY_LAST_MILE', 'SHIP_LAST_MILE'] }
      };
    } else if (role === 'SUB_ADMIN' || role === 'ADMIN') {
      // SUB_ADMIN and ADMIN see all tasks
      whereClause = {};
    } else {
      // Other roles (COMMERCIAL, etc.) see tasks related to their orders
      whereClause = {
        order: {
          userId
        }
      };
    }

    // Add optional filters
    if (status) {
      whereClause.status = status;
    }
    if (type) {
      whereClause.type = type;
    }
    if (orderId) {
      whereClause.orderId = orderId;
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        order: {
          select: {
            id: true,
            number: true,
            customer: {
              select: {
                firstName: true,
                lastName: true,
                companyName: true,
                email: true
              }
            }
          }
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        },
        assignedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        proofs: {
          select: {
            id: true,
            type: true,
            fileUrl: true,
            uploadedAt: true
          }
        },
        reviews: {
          include: {
            reviewedBy: {
              select: {
                firstName: true,
                lastName: true,
                role: true
              }
            }
          },
          orderBy: {
            reviewedAt: 'desc'
          }
        }
      },
      orderBy: {
        scheduledAt: 'asc'
      }
    });

    return res.json({
      success: true,
      tasks
    });
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des tâches',
      error: error.message
    });
  }
};

// Get single task
export const getTaskById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user!;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            customer: true,
            items: {
              include: {
                product: true
              }
            }
          }
        },
        assignedTo: true,
        assignedBy: true,
        proofs: {
          include: {
            uploadedBy: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            uploadedAt: 'desc'
          }
        },
        reviews: {
          include: {
            reviewedBy: true
          },
          orderBy: {
            reviewedAt: 'desc'
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tâche non trouvée'
      });
    }

    // Check access rights
    const hasAccess =
      role === 'ADMIN' ||
      role === 'SUB_ADMIN' ||
      task.assignedToId === userId ||
      task.order.userId === userId;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à cette tâche'
      });
    }

    return res.json({
      success: true,
      task
    });
  } catch (error: any) {
    console.error('Error fetching task:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la tâche',
      error: error.message
    });
  }
};

// Create task
export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, role } = req.user!;

    // Only ADMIN and SUB_ADMIN can create tasks
    if (role !== 'ADMIN' && role !== 'SUB_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Seuls les administrateurs peuvent créer des tâches'
      });
    }

    const {
      orderId,
      type,
      title,
      description,
      notes,
      assignedToId,
      scheduledAt,
      locationAddress,
      locationLatitude,
      locationLongitude
    } = req.body;

    if (!orderId || !type || !title) {
      return res.status(400).json({
        success: false,
        message: 'Commande, type et titre requis'
      });
    }

    // Verify order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    const task = await prisma.task.create({
      data: {
        orderId,
        type,
        title,
        description,
        notes,
        assignedToId,
        assignedById: userId,
        assignedAt: assignedToId ? new Date() : null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        locationAddress,
        locationLatitude,
        locationLongitude
      },
      include: {
        order: true,
        assignedTo: true
      }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'OTHER',
        description: `Tâche créée: ${title} pour commande ${order.number}`,
        userId
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Tâche créée avec succès',
      task
    });
  } catch (error: any) {
    console.error('Error creating task:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la tâche',
      error: error.message
    });
  }
};

// Update task status
export const updateTaskStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user!;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Statut requis'
      });
    }

    const task = await prisma.task.findUnique({
      where: { id },
      include: { order: true }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tâche non trouvée'
      });
    }

    // Check permissions
    const canUpdate =
      role === 'ADMIN' ||
      role === 'SUB_ADMIN' ||
      task.assignedToId === userId;

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à modifier cette tâche'
      });
    }

    // Update timestamps based on status
    const updateData: any = { status };

    if (status === 'IN_PROGRESS' && !task.startedAt) {
      updateData.startedAt = new Date();
    }
    if (status === 'DONE' && !task.completedAt) {
      updateData.completedAt = new Date();
    }
    if (notes) {
      updateData.notes = notes;
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        order: true,
        assignedTo: true,
        proofs: true
      }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'OTHER',
        description: `Tâche ${task.title} mise à jour: ${status}`,
        userId
      }
    });

    return res.json({
      success: true,
      message: 'Statut de la tâche mis à jour',
      task: updatedTask
    });
  } catch (error: any) {
    console.error('Error updating task status:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la tâche',
      error: error.message
    });
  }
};

// Add proof to task
export const addTaskProof = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params; // task ID
    const { userId } = req.user!;
    const {
      type,
      fileUrl,
      signatureData,
      noteText,
      latitude,
      longitude,
      accuracy,
      address
    } = req.body;

    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'Type de preuve requis'
      });
    }

    // Verify task exists and user has access
    const task = await prisma.task.findUnique({
      where: { id },
      include: { order: true }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tâche non trouvée'
      });
    }

    if (task.assignedToId !== userId && req.user!.role !== 'ADMIN' && req.user!.role !== 'SUB_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez pas ajouter de preuve à cette tâche'
      });
    }

    const proof = await prisma.taskProof.create({
      data: {
        taskId: id,
        type,
        fileUrl,
        signatureData,
        noteText,
        latitude,
        longitude,
        accuracy,
        address,
        uploadedById: userId
      },
      include: {
        uploadedBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Preuve ajoutée avec succès',
      proof
    });
  } catch (error: any) {
    console.error('Error adding task proof:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout de la preuve',
      error: error.message
    });
  }
};

// Review task (SUB_ADMIN only)
export const reviewTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params; // task ID
    const { userId, role } = req.user!;
    const { status, comments, actionsTaken } = req.body;

    // Only SUB_ADMIN and ADMIN can review
    if (role !== 'SUB_ADMIN' && role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Seuls les superviseurs peuvent valider les tâches'
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Statut de review requis'
      });
    }

    const task = await prisma.task.findUnique({
      where: { id },
      include: { order: true }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tâche non trouvée'
      });
    }

    // Create review
    const review = await prisma.taskReview.create({
      data: {
        taskId: id,
        status,
        comments,
        actionsTaken,
        reviewedById: userId
      },
      include: {
        reviewedBy: {
          select: {
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });

    // Update task status based on review
    let newTaskStatus = task.status;
    if (status === 'APPROVED') {
      newTaskStatus = 'APPROVED';
    } else if (status === 'REJECTED') {
      newTaskStatus = 'REJECTED';
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: { status: newTaskStatus }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'OTHER',
        description: `Tâche ${task.title} ${status === 'APPROVED' ? 'approuvée' : 'rejetée'} par superviseur`,
        userId
      }
    });

    return res.json({
      success: true,
      message: `Tâche ${status === 'APPROVED' ? 'approuvée' : 'rejetée'}`,
      review,
      task: updatedTask
    });
  } catch (error: any) {
    console.error('Error reviewing task:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la validation de la tâche',
      error: error.message
    });
  }
};

// Reassign task (SUB_ADMIN only)
export const reassignTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user!;
    const { assignedToId, notes } = req.body;

    // Only SUB_ADMIN and ADMIN can reassign
    if (role !== 'SUB_ADMIN' && role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Seuls les superviseurs peuvent réassigner les tâches'
      });
    }

    if (!assignedToId) {
      return res.status(400).json({
        success: false,
        message: 'Utilisateur assigné requis'
      });
    }

    const task = await prisma.task.findUnique({
      where: { id },
      include: { order: true }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tâche non trouvée'
      });
    }

    // Verify new assignee exists
    const newAssignee = await prisma.user.findUnique({
      where: { id: assignedToId }
    });

    if (!newAssignee) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        assignedToId,
        assignedById: userId,
        assignedAt: new Date(),
        notes: notes || task.notes
      },
      include: {
        assignedTo: true,
        order: true
      }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'OTHER',
        description: `Tâche ${task.title} réassignée à ${newAssignee.firstName} ${newAssignee.lastName}`,
        userId
      }
    });

    return res.json({
      success: true,
      message: 'Tâche réassignée avec succès',
      task: updatedTask
    });
  } catch (error: any) {
    console.error('Error reassigning task:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la réassignation de la tâche',
      error: error.message
    });
  }
};
