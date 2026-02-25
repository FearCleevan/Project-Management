import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import styles from './LoginPage.module.css'
import { useAuthStore } from '../stores/authStore'
import { ROLES } from '../utils/permissions'

const SAMPLE_CREDENTIALS = [
  { role: ROLES.SUPER_ADMIN, username: 'superadmin', password: 'Super123!' },
  { role: ROLES.ADMIN, username: 'admin', password: 'Admin123!' },
  { role: ROLES.MEMBER, username: 'member', password: 'Member123!' },
]

export default function LoginPage() {
  const currentUser = useAuthStore((state) => state.currentUser)
  const login = useAuthStore((state) => state.login)
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({
    username: '',
    password: '',
  })

  const redirectTo = useMemo(() => {
    return location.state?.from?.pathname || '/projects'
  }, [location.state])

  useEffect(() => {
    if (currentUser) {
      navigate('/projects', { replace: true })
    }
  }, [currentUser, navigate])

  function handleSubmit(event) {
    event.preventDefault()

    try {
      const user = login({
        username: form.username,
        password: form.password,
      })
      toast.success(`Welcome ${user.name}.`)
      navigate(redirectTo, { replace: true })
    } catch (error) {
      toast.error(error.message || 'Unable to log in.')
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.card}>
          <div className={styles.logoWrap}>
            <div className={styles.logo}>PM</div>
            <div>
              <h1 className={styles.title}>Project Management</h1>
              <p className={styles.subtitle}>Sign in to continue to your workspace.</p>
            </div>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.label}>
              Username
              <input
                className={styles.input}
                type="text"
                value={form.username}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, username: event.target.value }))
                }
                autoComplete="username"
                required
              />
            </label>
            <label className={styles.label}>
              Password
              <input
                className={styles.input}
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, password: event.target.value }))
                }
                autoComplete="current-password"
                required
              />
            </label>
            <button className={styles.button} type="submit">
              Submit
            </button>
          </form>
        </section>

        <aside className={styles.helpCard}>
          <h2 className={styles.helpTitle}>Sample Credentials</h2>
          <ul className={styles.credentialsList}>
            {SAMPLE_CREDENTIALS.map((item) => (
              <li key={item.role} className={styles.credentialItem}>
                <span className={styles.role}>{item.role}</span>
                <span>{`Username: ${item.username}`}</span>
                <span>{`Password: ${item.password}`}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  )
}
