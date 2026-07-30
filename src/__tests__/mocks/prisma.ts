import { jest } from "@jest/globals";

type AnyMock = jest.Mock<any, any>;

export const mockPrisma = {
  patient: {
    findMany: jest.fn<AnyMock>(),
    findUnique: jest.fn<AnyMock>(),
    findFirst: jest.fn<AnyMock>(),
    create: jest.fn<AnyMock>(),
    update: jest.fn<AnyMock>(),
    delete: jest.fn<AnyMock>(),
    count: jest.fn<AnyMock>(),
  },
  doctor: {
    findMany: jest.fn<AnyMock>(),
    findUnique: jest.fn<AnyMock>(),
    findFirst: jest.fn<AnyMock>(),
    create: jest.fn<AnyMock>(),
    update: jest.fn<AnyMock>(),
    delete: jest.fn<AnyMock>(),
    count: jest.fn<AnyMock>(),
  },
  appointment: {
    findMany: jest.fn<AnyMock>(),
    findUnique: jest.fn<AnyMock>(),
    findFirst: jest.fn<AnyMock>(),
    create: jest.fn<AnyMock>(),
    update: jest.fn<AnyMock>(),
    delete: jest.fn<AnyMock>(),
    count: jest.fn<AnyMock>(),
  },
  medicalRecord: {
    findMany: jest.fn<AnyMock>(),
    findUnique: jest.fn<AnyMock>(),
    findFirst: jest.fn<AnyMock>(),
    create: jest.fn<AnyMock>(),
    update: jest.fn<AnyMock>(),
    delete: jest.fn<AnyMock>(),
    count: jest.fn<AnyMock>(),
  },
  diagnosis: {
    findMany: jest.fn<AnyMock>(),
    findUnique: jest.fn<AnyMock>(),
    findFirst: jest.fn<AnyMock>(),
    create: jest.fn<AnyMock>(),
    update: jest.fn<AnyMock>(),
    delete: jest.fn<AnyMock>(),
    groupBy: jest.fn<AnyMock>(),
  },
  prescription: {
    findMany: jest.fn<AnyMock>(),
    findUnique: jest.fn<AnyMock>(),
    findFirst: jest.fn<AnyMock>(),
    create: jest.fn<AnyMock>(),
    update: jest.fn<AnyMock>(),
    delete: jest.fn<AnyMock>(),
  },
  insuranceClaim: {
    findMany: jest.fn<AnyMock>(),
    findUnique: jest.fn<AnyMock>(),
    findFirst: jest.fn<AnyMock>(),
    create: jest.fn<AnyMock>(),
    update: jest.fn<AnyMock>(),
    delete: jest.fn<AnyMock>(),
  },
  receptionist: {
    findMany: jest.fn<AnyMock>(),
    findUnique: jest.fn<AnyMock>(),
    findFirst: jest.fn<AnyMock>(),
    create: jest.fn<AnyMock>(),
    update: jest.fn<AnyMock>(),
    delete: jest.fn<AnyMock>(),
    count: jest.fn<AnyMock>(),
  },
  admin: {
    findMany: jest.fn<AnyMock>(),
    findUnique: jest.fn<AnyMock>(),
    findFirst: jest.fn<AnyMock>(),
    create: jest.fn<AnyMock>(),
    update: jest.fn<AnyMock>(),
    delete: jest.fn<AnyMock>(),
  },
  $transaction: jest.fn<AnyMock>((fn: any) => fn(mockPrisma)),
};

const MODEL_KEYS = [
  "patient", "doctor", "appointment", "medicalRecord",
  "diagnosis", "prescription", "insuranceClaim",
  "receptionist", "admin",
] as const;

export const resetMocks = () => {
  for (const key of MODEL_KEYS) {
    const model = mockPrisma[key] as Record<string, AnyMock>;
    for (const method of Object.values(model)) {
      method.mockReset();
    }
  }
  (mockPrisma.$transaction as AnyMock).mockReset();
  (mockPrisma.$transaction as AnyMock).mockImplementation((fn: any) => fn(mockPrisma));
};
