import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { closeBrowser } from '../src/rendering/pdf';
import { ADMIN, api, loginAsAdmin, resetDatabase } from './helpers';

let token: string;
const auth = () => ({ Authorization: `Bearer ${token}` });

beforeAll(async () => {
  await resetDatabase();
  token = await loginAsAdmin();
});

afterAll(async () => {
  await closeBrowser();
  await prisma.$disconnect();
});

describe('auth', () => {
  it('rechaza credenciales incorrectas', async () => {
    const res = await api().post('/api/auth/login').send({ email: ADMIN.email, password: 'mala' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Credenciales incorrectas');
  });

  it('exige token en rutas protegidas', async () => {
    await api().get('/api/courses').expect(401);
  });

  it('devuelve el perfil del usuario autenticado', async () => {
    const res = await api().get('/api/auth/me').set(auth()).expect(200);
    expect(res.body).toMatchObject({ email: ADMIN.email, role: 'admin' });
  });
});

describe('validacion', () => {
  it('responde 400 con detalle por campo', async () => {
    const res = await api().post('/api/courses').set(auth()).send({ type: 'invalido' }).expect(400);
    expect(res.body.error).toBe('Datos de entrada invalidos');
    expect(res.body.details.map((d: { field: string }) => d.field)).toEqual(expect.arrayContaining(['name', 'type']));
  });
});

describe('flujo completo: curso -> inscripcion -> emision -> reimpresion -> revocacion', () => {
  let courseId: number;
  let participantId: number;
  let certificateId: number;
  let uuid: string;

  it('crea curso y participante e inscribe', async () => {
    const course = await api()
      .post('/api/courses')
      .set(auth())
      .send({ name: 'Curso de prueba', type: 'curso', duration_hours: 10 })
      .expect(201);
    courseId = course.body.id;

    const participant = await api()
      .post('/api/participants')
      .set(auth())
      .send({ full_name: 'Ana Torres', email: 'ana@test.local' })
      .expect(201);
    participantId = participant.body.id;
    expect(participant.body.tags).toEqual([]);

    const enroll = await api()
      .post(`/api/courses/${courseId}/participants`)
      .set(auth())
      .send({ participant_ids: [participantId, 999999] })
      .expect(201);
    expect(enroll.body).toEqual({ enrolled: [participantId], already_enrolled: [], not_found: [999999] });
  });

  it('no emite si el participante no ha completado', async () => {
    const res = await api()
      .post('/api/certificates/emit')
      .set(auth())
      .send({ course_id: courseId, participant_ids: [participantId] })
      .expect(200);
    expect(res.body.emitted).toHaveLength(0);
    expect(res.body.errors).toHaveLength(1);
  });

  it('emite el certificado con la plantilla por defecto', async () => {
    await api()
      .put(`/api/courses/${courseId}/participants/${participantId}`)
      .set(auth())
      .send({ attendance_status: 'completed' })
      .expect(200);

    const res = await api()
      .post('/api/certificates/emit')
      .set(auth())
      .send({ course_id: courseId, participant_ids: [participantId] })
      .expect(201);
    expect(res.body.emitted).toHaveLength(1);
    certificateId = res.body.emitted[0].certificate_id;
    uuid = res.body.emitted[0].uuid;

    const pdf = await api().get(`/api/certificates/${certificateId}/download`).set(auth()).expect(200);
    expect(pdf.headers['content-type']).toBe('application/pdf');
  });

  it('no duplica certificados validos', async () => {
    const res = await api()
      .post('/api/certificates/emit')
      .set(auth())
      .send({ course_id: courseId, participant_ids: [participantId] })
      .expect(200);
    expect(res.body.already_exists).toEqual([participantId]);
  });

  it('muestra el certificado en las inscripciones del curso', async () => {
    const res = await api().get(`/api/courses/${courseId}/participants`).set(auth()).expect(200);
    expect(res.body.participants[0].certificate).toMatchObject({ id: certificateId, uuid, status: 'valid' });
  });

  it('reimprime conservando el uuid (mismo QR)', async () => {
    const res = await api().post(`/api/certificates/${certificateId}/reprint`).set(auth()).expect(200);
    expect(res.body.certificate.uuid).toBe(uuid);
    expect(res.body.certificate.reprint_count).toBe(1);
    expect(res.body.certificate.pdf_path).toContain(`${uuid}_r1.pdf`);
  });

  it('verifica publicamente y refleja la revocacion', async () => {
    const valid = await api().get(`/api/verify/${uuid}`).expect(200);
    expect(valid.body.status).toBe('VALIDO');
    expect(valid.body.certificate.participant.full_name).toBe('Ana Torres');

    await api().post(`/api/certificates/${certificateId}/revoke`).set(auth()).send({ reason: 'Error' }).expect(200);

    const revoked = await api().get(`/api/verify/${uuid}`).expect(200);
    expect(revoked.body.status).toBe('REVOCADO');
    await api().post(`/api/certificates/${certificateId}/reprint`).set(auth()).expect(409);
  });

  it('no permite borrar un curso con certificados', async () => {
    await api().delete(`/api/courses/${courseId}`).set(auth()).expect(409);
  });
});
