import { useRef, useState } from 'react'
import { toast } from 'react-toastify'
import styles from './UserManagementPage.module.css'
import { useAuthStore } from '../stores/authStore'
import { POSITIONS, useUsersStore } from '../stores/usersStore'
import { ROLES, canManageUsers, canRemoveUser } from '../utils/permissions'

const DEFAULT_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
  position: POSITIONS[0],
  role: ROLES.MEMBER,
  profileImage: '',
}

export default function UserManagementPage() {
  const currentUser = useAuthStore((state) => state.currentUser)
  const syncCurrentUser = useAuthStore((state) => state.syncCurrentUser)
  const users = useUsersStore((state) => state.listUsers())
  const createUser = useUsersStore((state) => state.createUser)
  const updateUser = useUsersStore((state) => state.updateUser)
  const removeUser = useUsersStore((state) => state.removeUser)
  const createFileInputRef = useRef(null)
  const editFileInputRef = useRef(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingUserId, setEditingUserId] = useState(null)
  const [createForm, setCreateForm] = useState(DEFAULT_FORM)
  const [editForm, setEditForm] = useState(DEFAULT_FORM)

  const isSuperAdmin = canManageUsers(currentUser)
  const showRemoveAction = canRemoveUser(currentUser)

  function openCreateModal() {
    setCreateForm(DEFAULT_FORM)
    setIsCreateModalOpen(true)
  }

  function closeCreateModal() {
    setIsCreateModalOpen(false)
    setCreateForm(DEFAULT_FORM)
  }

  function openEditModal(user) {
    setEditingUserId(user.id)
    setEditForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      username: user.username || '',
      password: '',
      confirmPassword: '',
      position: user.position || POSITIONS[0],
      role: user.role || ROLES.MEMBER,
      profileImage: user.profileImage || '',
    })
    setIsEditModalOpen(true)
  }

  function closeEditModal() {
    setIsEditModalOpen(false)
    setEditingUserId(null)
    setEditForm(DEFAULT_FORM)
  }

  function readImageFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(new Error('Failed to read image file.'))
      reader.readAsDataURL(file)
    })
  }

  async function handleProfileImageChange(event, setForm) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file.')
      return
    }

    try {
      const imageData = await readImageFile(file)
      setForm((prev) => ({ ...prev, profileImage: String(imageData) }))
    } catch (error) {
      toast.error(error.message || 'Unable to upload profile image.')
    }
  }

  function clearProfileImage(setForm, ref) {
    setForm((prev) => ({ ...prev, profileImage: '' }))
    if (ref.current) {
      ref.current.value = ''
    }
  }

  function handleCreateSubmit(event) {
    event.preventDefault()
    if (createForm.password !== createForm.confirmPassword) {
      toast.error('Password and confirm password do not match.')
      return
    }

    try {
      createUser({
        actor: currentUser,
        data: {
          firstName: createForm.firstName,
          lastName: createForm.lastName,
          email: createForm.email,
          username: createForm.username,
          password: createForm.password,
          position: createForm.position,
          profileImage: createForm.profileImage,
          role: createForm.role,
        },
      })
      toast.success('User created successfully.')
      closeCreateModal()
    } catch (error) {
      toast.error(error.message || 'Unable to create user.')
    }
  }

  function handleEditSubmit(event) {
    event.preventDefault()

    if (editForm.password || editForm.confirmPassword) {
      if (editForm.password !== editForm.confirmPassword) {
        toast.error('Password and confirm password do not match.')
        return
      }
    }

    try {
      const payload = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email,
        username: editForm.username,
        position: editForm.position,
        role: editForm.role,
        profileImage: editForm.profileImage,
      }

      if (editForm.password) {
        payload.password = editForm.password
      }

      updateUser({
        actor: currentUser,
        userId: editingUserId,
        data: payload,
      })
      syncCurrentUser()
      toast.success('User updated successfully.')
      closeEditModal()
    } catch (error) {
      toast.error(error.message || 'Unable to update user.')
    }
  }

  function handleRemoveUser(userId) {
    try {
      removeUser({
        actor: currentUser,
        userId,
      })
      toast.success('User removed successfully.')
    } catch (error) {
      toast.error(error.message || 'Unable to remove user.')
    }
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>User Management</h1>
        <p className={styles.subtitle}>Only Super Admin can manage users and roles.</p>
        {isSuperAdmin && (
          <button type="button" className={styles.primaryButton} onClick={openCreateModal}>
            Create User
          </button>
        )}
      </header>

      <article className={styles.card}>
        <h2 className={styles.cardTitle}>Workspace Users</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Profile</th>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Position</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    {user.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt={user.name}
                        className={styles.avatarSmall}
                      />
                    ) : (
                      <div className={styles.avatarSmallPlaceholder}>
                        {`${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`}
                      </div>
                    )}
                  </td>
                  <td>{user.name}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.position}</td>
                  <td>{user.role}</td>
                  <td>
                    <div className={styles.rowActions}>
                      {isSuperAdmin && (
                        <button
                          type="button"
                          className={styles.inlineButton}
                          onClick={() => openEditModal(user)}
                        >
                          Edit
                        </button>
                      )}
                      {showRemoveAction && (
                        <button
                          type="button"
                          className={styles.dangerButton}
                          onClick={() => handleRemoveUser(user.id)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      {isCreateModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Create User</h3>
              <button type="button" className={styles.inlineButton} onClick={closeCreateModal}>
                Close
              </button>
            </div>

            <form className={styles.form} onSubmit={handleCreateSubmit}>
              <div className={styles.avatarEditor}>
                {createForm.profileImage ? (
                  <img
                    src={createForm.profileImage}
                    alt="Profile preview"
                    className={styles.avatarLarge}
                  />
                ) : (
                  <div className={styles.avatarLargePlaceholder}>+</div>
                )}
                <div className={styles.avatarActions}>
                  <button
                    type="button"
                    className={styles.inlineButton}
                    onClick={() => createFileInputRef.current?.click()}
                  >
                    Upload New
                  </button>
                  <button
                    type="button"
                    className={styles.inlineButton}
                    onClick={() => clearProfileImage(setCreateForm, createFileInputRef)}
                  >
                    Remove
                  </button>
                </div>
                <input
                  ref={createFileInputRef}
                  className={styles.hiddenInput}
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleProfileImageChange(event, setCreateForm)}
                />
              </div>

              <div className={styles.formGrid}>
                <label className={styles.label}>
                  First Name
                  <input
                    className={styles.input}
                    type="text"
                    value={createForm.firstName}
                    onChange={(event) =>
                      setCreateForm((prev) => ({ ...prev, firstName: event.target.value }))
                    }
                    required
                  />
                </label>
                <label className={styles.label}>
                  Last Name
                  <input
                    className={styles.input}
                    type="text"
                    value={createForm.lastName}
                    onChange={(event) =>
                      setCreateForm((prev) => ({ ...prev, lastName: event.target.value }))
                    }
                    required
                  />
                </label>
                <label className={styles.label}>
                  Email
                  <input
                    className={styles.input}
                    type="email"
                    value={createForm.email}
                    onChange={(event) =>
                      setCreateForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                    required
                  />
                </label>
                <label className={styles.label}>
                  Username
                  <input
                    className={styles.input}
                    type="text"
                    value={createForm.username}
                    onChange={(event) =>
                      setCreateForm((prev) => ({ ...prev, username: event.target.value }))
                    }
                    required
                  />
                </label>
                <label className={styles.label}>
                  Password
                  <input
                    className={styles.input}
                    type="password"
                    value={createForm.password}
                    onChange={(event) =>
                      setCreateForm((prev) => ({ ...prev, password: event.target.value }))
                    }
                    required
                  />
                </label>
                <label className={styles.label}>
                  Confirm Password
                  <input
                    className={styles.input}
                    type="password"
                    value={createForm.confirmPassword}
                    onChange={(event) =>
                      setCreateForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
                    }
                    required
                  />
                </label>
                <label className={styles.label}>
                  Position
                  <select
                    className={styles.select}
                    value={createForm.position}
                    onChange={(event) =>
                      setCreateForm((prev) => ({ ...prev, position: event.target.value }))
                    }
                  >
                    {POSITIONS.map((position) => (
                      <option key={position} value={position}>
                        {position}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.label}>
                  Role
                  <select
                    className={styles.select}
                    value={createForm.role}
                    onChange={(event) =>
                      setCreateForm((prev) => ({ ...prev, role: event.target.value }))
                    }
                  >
                    <option value={ROLES.SUPER_ADMIN}>SUPER_ADMIN</option>
                    <option value={ROLES.ADMIN}>ADMIN</option>
                    <option value={ROLES.MEMBER}>MEMBER</option>
                  </select>
                </label>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.inlineButton} onClick={closeCreateModal}>
                  Cancel
                </button>
                <button className={styles.primaryButton} type="submit">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Edit User</h3>
              <button type="button" className={styles.inlineButton} onClick={closeEditModal}>
                Close
              </button>
            </div>

            <form className={styles.form} onSubmit={handleEditSubmit}>
              <div className={styles.avatarEditor}>
                {editForm.profileImage ? (
                  <img src={editForm.profileImage} alt="Profile preview" className={styles.avatarLarge} />
                ) : (
                  <div className={styles.avatarLargePlaceholder}>+</div>
                )}
                <div className={styles.avatarActions}>
                  <button
                    type="button"
                    className={styles.inlineButton}
                    onClick={() => editFileInputRef.current?.click()}
                  >
                    Upload New
                  </button>
                  <button
                    type="button"
                    className={styles.inlineButton}
                    onClick={() => clearProfileImage(setEditForm, editFileInputRef)}
                  >
                    Remove
                  </button>
                </div>
                <input
                  ref={editFileInputRef}
                  className={styles.hiddenInput}
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleProfileImageChange(event, setEditForm)}
                />
              </div>

              <div className={styles.formGrid}>
                <label className={styles.label}>
                  First Name
                  <input
                    className={styles.input}
                    type="text"
                    value={editForm.firstName}
                    onChange={(event) =>
                      setEditForm((prev) => ({ ...prev, firstName: event.target.value }))
                    }
                    required
                  />
                </label>
                <label className={styles.label}>
                  Last Name
                  <input
                    className={styles.input}
                    type="text"
                    value={editForm.lastName}
                    onChange={(event) =>
                      setEditForm((prev) => ({ ...prev, lastName: event.target.value }))
                    }
                    required
                  />
                </label>
                <label className={styles.label}>
                  Email
                  <input
                    className={styles.input}
                    type="email"
                    value={editForm.email}
                    onChange={(event) =>
                      setEditForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                    required
                  />
                </label>
                <label className={styles.label}>
                  Username
                  <input
                    className={styles.input}
                    type="text"
                    value={editForm.username}
                    onChange={(event) =>
                      setEditForm((prev) => ({ ...prev, username: event.target.value }))
                    }
                    required
                  />
                </label>
                <label className={styles.label}>
                  Password (Reset Optional)
                  <input
                    className={styles.input}
                    type="password"
                    value={editForm.password}
                    onChange={(event) =>
                      setEditForm((prev) => ({ ...prev, password: event.target.value }))
                    }
                    placeholder="Leave blank to keep current password"
                  />
                </label>
                <label className={styles.label}>
                  Confirm Password
                  <input
                    className={styles.input}
                    type="password"
                    value={editForm.confirmPassword}
                    onChange={(event) =>
                      setEditForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
                    }
                    placeholder="Repeat new password"
                  />
                </label>
                <label className={styles.label}>
                  Position
                  <select
                    className={styles.select}
                    value={editForm.position}
                    onChange={(event) =>
                      setEditForm((prev) => ({ ...prev, position: event.target.value }))
                    }
                  >
                    {POSITIONS.map((position) => (
                      <option key={position} value={position}>
                        {position}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.label}>
                  Role
                  <select
                    className={styles.select}
                    value={editForm.role}
                    onChange={(event) =>
                      setEditForm((prev) => ({ ...prev, role: event.target.value }))
                    }
                  >
                    <option value={ROLES.SUPER_ADMIN}>SUPER_ADMIN</option>
                    <option value={ROLES.ADMIN}>ADMIN</option>
                    <option value={ROLES.MEMBER}>MEMBER</option>
                  </select>
                </label>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.inlineButton} onClick={closeEditModal}>
                  Cancel
                </button>
                <button className={styles.primaryButton} type="submit">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
