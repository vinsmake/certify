import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { useAuth } from '../auth/useAuth';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Field';
import { APP_TITLE } from '../config';
import { httpStatus } from '../lib/http';

const LoginPage = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const status = httpStatus(err);
      if (status === 401) setError('Email o contraseña incorrectos.');
      else if (status === 400) setError('Completa todos los campos.');
      else if (!status) setError('No se pudo conectar con el servidor.');
      else setError('Ocurrio un error inesperado. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="centered-page">
      <div className="card card--narrow">
        <div className="stack-sm" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1>Credenciales Digitales</h1>
          <p className="muted">Ingresa tus credenciales para acceder al sistema</p>
        </div>
        <form className="form" onSubmit={handleSubmit}>
          <Input
            label="Correo electronico"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="usuario@correo.com"
          />
          <Input
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <Alert type="error">{error}</Alert>}
          <Button type="submit" size="lg" block loading={loading}>
            Ingresar
          </Button>
        </form>
      </div>
      <p className="muted small">{APP_TITLE}</p>
    </div>
  );
};

export default LoginPage;
