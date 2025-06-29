export function isStrongPassword(password: string): boolean {
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};:"\\|,.<>\/?]).{8,64}$/;
    return strongPasswordRegex.test(password);
  }
  