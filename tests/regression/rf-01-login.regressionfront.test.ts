import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('RF-01 Frontend - Inicio de sesión', () => {


  let loginService: ReturnType<typeof vi.fn>;
  let setSession: ReturnType<typeof vi.fn>;
  
  beforeEach(() => {


  // Mock del servicio API

  loginService = vi.fn();

  // Mock del almacenamiento de sesión

    setSession = vi.fn();
  });

  it('Camino 1 - usuario válido puede iniciar sesión', async () => {
    // Arrange

    loginService.mockResolvedValue({

      id:'user-001',
      name:'Usuario prueba',
      token:'token-demo'
    });
    // Act
    const resultado = await loginUsuario(
      {
        email:'usuario@test.com',

        password:'123456'

      },
      loginService,
      setSession

    );
    // Assert
    expect(resultado.name)
      .toBe('Usuario prueba');

    expect(setSession)
      .toHaveBeenCalledWith('token-demo');
  });

  it('Camino 2 - usuario inexistente muestra error', async () => {
    // Arrange
    loginService.mockRejectedValue(

      new Error('Usuario no encontrado')
        );
        
    // Act + Assert
    await expect(
      loginUsuario(
        {
          email:'noexiste@test.com',

          password:'123456'

        },
        loginService,
        setSession
      )
    )
    .rejects
    .toThrow('Usuario no encontrado');
  });

  it('Camino 3 - contraseña incorrecta rechaza acceso', async () => {
    loginService.mockRejectedValue(
      new Error('Credenciales incorrectas')
    );
    await expect(
      loginUsuario(
        {
          email:'usuario@test.com',

          password:'clave-mala'

        },
        loginService,
        setSession
            )
    )
    .rejects
    .toThrow('Credenciales incorrectas');
  });
  it('Camino 4 - campos vacíos bloquean login', async () => {
    await expect(
      loginUsuario(
        {
          email:'',

          password:''

        },
        loginService,
        setSession
      )
    )
    .rejects
    .toThrow('Campos obligatorios');
  });
});

// Simulación de lógica del frontend

async function loginUsuario(

 data:any,

 loginService:any,

 setSession:any

){


 if(!data.email || !data.password){

  throw new Error('Campos obligatorios');
}
 const usuario = await loginService(data);
 setSession(usuario.token);
 return usuario;
}