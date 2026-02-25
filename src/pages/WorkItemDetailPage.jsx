import { useEffect, useMemo, useRef, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  FiAlignCenter,
  FiAlignLeft,
  FiAlignRight,
  FiBold,
  FiCode,
  FiImage,
  FiItalic,
  FiList,
  FiPaperclip,
  FiType,
  FiUnderline,
} from 'react-icons/fi'
import styles from './WorkItemDetailPage.module.css'
import { useAuthStore } from '../stores/authStore'
import { useProjectsStore } from '../stores/projectsStore'
import { useUsersStore } from '../stores/usersStore'
import { useWorkItemsStore } from '../stores/workItemsStore'
import { WORK_ITEM_PRIORITIES } from '../utils/models'
import { canComment, canEditTicket, canMoveTicket } from '../utils/permissions'

const EMPTY_FORM = {
  title: '',
  descriptionHtml: '',
  state: 'Todo',
  priority: WORK_ITEM_PRIORITIES.NONE,
  assigneeId: '',
  startDate: '',
  dueDate: '',
  estimate: '',
  attachments: [],
}

export default function WorkItemDetailPage() {
  const { projectId, workItemId } = useParams()
  const currentUser = useAuthStore((state) => state.currentUser)
  const users = useUsersStore((state) => state.listUsers())
  const loadProjects = useProjectsStore((state) => state.loadProjects)
  const loadByProject = useWorkItemsStore((state) => state.loadByProject)
  const getWorkItem = useWorkItemsStore((state) => state.get)
  const updateWorkItem = useWorkItemsStore((state) => state.update)
  const moveStatus = useWorkItemsStore((state) => state.moveStatus)
  const addComment = useWorkItemsStore((state) => state.addComment)
  const [form, setForm] = useState(EMPTY_FORM)
  const [commentHtml, setCommentHtml] = useState('')
  const [fontSize, setFontSize] = useState('normal')
  const commentEditorRef = useRef(null)
  const imageInputRef = useRef(null)
  const attachmentInputRef = useRef(null)

  const canEditFields = canEditTicket(currentUser)
  const canMoveStatus = canMoveTicket(currentUser)
  const canAddComment = canComment(currentUser)

  useEffect(() => {
    loadProjects()
    if (projectId) {
      loadByProject(projectId)
    }
  }, [loadByProject, loadProjects, projectId])

  const item = useMemo(() => getWorkItem(workItemId), [getWorkItem, workItemId])

  useEffect(() => {
    if (!item) {
      return
    }

    setForm({
      title: item.title || '',
      descriptionHtml: item.descriptionHtml || '',
      state: item.state || 'Todo',
      priority: item.priority || WORK_ITEM_PRIORITIES.NONE,
      assigneeId: item.assigneeId || '',
      startDate: item.startDate || '',
      dueDate: item.dueDate || '',
      estimate: item.estimate ?? '',
      attachments: item.attachments || [],
    })
  }, [item])

  function resolveUserName(userId) {
    return users.find((user) => user.id === userId)?.name || userId || 'Unknown'
  }

  function runEditorCommand(command, value = null) {
    const editor = document.getElementById('ticket-detail-editor')
    if (!editor || !canEditFields) {
      return
    }

    editor.focus()
    document.execCommand(command, false, value)
    setForm((prev) => ({ ...prev, descriptionHtml: editor.innerHTML }))
  }

  function handleFontSizeChange(size) {
    setFontSize(size)
    const map = { small: '2', normal: '3', large: '5' }
    runEditorCommand('fontSize', map[size] || '3')
  }

  function handleInsertImageUrl() {
    const url = window.prompt('Enter image URL')
    if (!url) {
      return
    }
    runEditorCommand('insertImage', url)
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(new Error('Failed to read file.'))
      reader.readAsDataURL(file)
    })
  }

  async function handleUploadInlineImage(event) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file.')
      return
    }

    try {
      const dataUrl = String(await readFileAsDataUrl(file))
      runEditorCommand('insertImage', dataUrl)
      setForm((prev) => ({
        ...prev,
        attachments: [
          ...prev.attachments,
          {
            name: file.name,
            type: file.type,
            dataUrl,
            createdAt: new Date().toISOString(),
            createdBy: currentUser?.id || '',
          },
        ],
      }))
    } catch (error) {
      toast.error(error.message || 'Unable to upload image.')
    } finally {
      if (imageInputRef.current) {
        imageInputRef.current.value = ''
      }
    }
  }

  async function handleUploadAttachment(event) {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) {
      return
    }

    try {
      const attachments = await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          type: file.type || 'application/octet-stream',
          dataUrl: String(await readFileAsDataUrl(file)),
          createdAt: new Date().toISOString(),
          createdBy: currentUser?.id || '',
        })),
      )
      setForm((prev) => ({
        ...prev,
        attachments: [...prev.attachments, ...attachments],
      }))
      toast.success('Attachment(s) added.')
    } catch (error) {
      toast.error(error.message || 'Unable to upload attachments.')
    } finally {
      if (attachmentInputRef.current) {
        attachmentInputRef.current.value = ''
      }
    }
  }

  function removeAttachment(index) {
    setForm((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }))
  }

  function handleSaveFields(event) {
    event.preventDefault()
    if (!item) {
      return
    }

    try {
      updateWorkItem({
        actor: currentUser,
        workItemId: item.id,
        patch: {
          title: form.title,
          descriptionHtml: form.descriptionHtml,
          priority: form.priority,
          assigneeId: form.assigneeId || null,
          startDate: form.startDate || null,
          dueDate: form.dueDate || null,
          estimate: form.estimate === '' ? null : Number(form.estimate),
          attachments: form.attachments,
        },
      })
      toast.success('Work item fields updated.')
    } catch (error) {
      toast.error(error.message || 'Unable to update fields.')
    }
  }

  function handleStatusChange(newState) {
    if (!item) {
      return
    }

    setForm((prev) => ({ ...prev, state: newState }))
    try {
      moveStatus({
        actor: currentUser,
        workItemId: item.id,
        newState,
      })
      toast.success('Status updated.')
    } catch (error) {
      toast.error(error.message || 'Unable to update status.')
    }
  }

  function handleAddComment(event) {
    event.preventDefault()
    if (!item) {
      return
    }

    try {
      const plainText = commentHtml.replace(/<[^>]+>/g, '').trim()
      if (!plainText) {
        toast.error('Comment cannot be empty.')
        return
      }

      addComment({
        actor: currentUser,
        workItemId: item.id,
        html: commentHtml,
      })
      setCommentHtml('')
      if (commentEditorRef.current) {
        commentEditorRef.current.innerHTML = ''
      }
      toast.success('Comment added.')
    } catch (error) {
      toast.error(error.message || 'Unable to add comment.')
    }
  }

  function runCommentCommand(command, value = null) {
    if (!commentEditorRef.current || !canAddComment) {
      return
    }

    commentEditorRef.current.focus()
    document.execCommand(command, false, value)
    setCommentHtml(commentEditorRef.current.innerHTML)
  }

  function handleCommentFontSizeChange(size) {
    const map = { small: '2', normal: '3', large: '5' }
    runCommentCommand('fontSize', map[size] || '3')
  }

  if (!item) {
    return (
      <section className={styles.page}>
        <h1 className={styles.title}>Work Item</h1>
        <p className={styles.subtle}>Work item not found.</p>
      </section>
    )
  }

  const activities = [...(item.activities || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{item.title}</h1>
        <p className={styles.subtle}>{`Ticket ID: ${item.id}`}</p>
      </header>

      <form className={styles.card} onSubmit={handleSaveFields}>
        <div className={styles.formGrid}>
          <label className={styles.label}>
            Title
            <input
              className={styles.input}
              type="text"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              disabled={!canEditFields}
              required
            />
          </label>

          <label className={styles.label}>
            Status
            <select
              className={styles.input}
              value={form.state}
              onChange={(event) => handleStatusChange(event.target.value)}
              disabled={!canMoveStatus}
            >
              <option value="Todo">Todo</option>
              <option value="In Progress">In Progress</option>
              <option value="In Review">In Review</option>
              <option value="Done">Done</option>
            </select>
          </label>

          <label className={styles.label}>
            Priority
            <select
              className={styles.input}
              value={form.priority}
              onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value }))}
              disabled={!canEditFields}
            >
              {Object.values(WORK_ITEM_PRIORITIES).map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.label}>
            Assignee
            <select
              className={styles.input}
              value={form.assigneeId}
              onChange={(event) => setForm((prev) => ({ ...prev, assigneeId: event.target.value }))}
              disabled={!canEditFields}
            >
              <option value="">Unassigned</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.label}>
            Start Date
            <input
              className={styles.input}
              type="date"
              value={form.startDate || ''}
              onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))}
              disabled={!canEditFields}
            />
          </label>

          <label className={styles.label}>
            Due Date
            <input
              className={styles.input}
              type="date"
              value={form.dueDate || ''}
              onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))}
              disabled={!canEditFields}
            />
          </label>

          <label className={styles.label}>
            Estimate (hours)
            <input
              className={styles.input}
              type="number"
              value={form.estimate}
              onChange={(event) => setForm((prev) => ({ ...prev, estimate: event.target.value }))}
              disabled={!canEditFields}
              min="0"
            />
          </label>
        </div>

        <label className={styles.label}>
          Description
          {canEditFields && (
            <div className={styles.toolbar}>
              <button type="button" className={styles.ghostButton} onClick={() => runEditorCommand('bold')}>
                <FiBold />
              </button>
              <button type="button" className={styles.ghostButton} onClick={() => runEditorCommand('italic')}>
                <FiItalic />
              </button>
              <button type="button" className={styles.ghostButton} onClick={() => runEditorCommand('underline')}>
                <FiUnderline />
              </button>
              <button type="button" className={styles.ghostButton} onClick={() => runEditorCommand('strikeThrough')}>
                <span className={styles.toolbarGlyph}>S</span>
              </button>
              <button type="button" className={styles.ghostButton} onClick={() => runEditorCommand('justifyLeft')}>
                <FiAlignLeft />
              </button>
              <button type="button" className={styles.ghostButton} onClick={() => runEditorCommand('justifyCenter')}>
                <FiAlignCenter />
              </button>
              <button type="button" className={styles.ghostButton} onClick={() => runEditorCommand('justifyRight')}>
                <FiAlignRight />
              </button>
              <button type="button" className={styles.ghostButton} onClick={() => runEditorCommand('insertOrderedList')}>
                <span className={styles.toolbarGlyph}>1.</span>
              </button>
              <button type="button" className={styles.ghostButton} onClick={() => runEditorCommand('insertUnorderedList')}>
                <FiList />
              </button>
              <button type="button" className={styles.ghostButton} onClick={() => runEditorCommand('formatBlock', 'blockquote')}>
                <span className={styles.toolbarGlyph}>""</span>
              </button>
              <button type="button" className={styles.ghostButton} onClick={() => runEditorCommand('formatBlock', 'pre')}>
                <FiCode />
              </button>
              <button type="button" className={styles.ghostButton} onClick={handleInsertImageUrl}>
                <FiImage />
              </button>
              <button type="button" className={styles.ghostButton} onClick={() => imageInputRef.current?.click()}>
                <FiImage />
              </button>
              <button type="button" className={styles.ghostButton} onClick={() => attachmentInputRef.current?.click()}>
                <FiPaperclip />
              </button>
              <select className={styles.input} value={fontSize} onChange={(event) => handleFontSizeChange(event.target.value)}>
                <option value="small">Small</option>
                <option value="normal">Normal</option>
                <option value="large">Large</option>
              </select>
            </div>
          )}
          <input
            ref={imageInputRef}
            className={styles.hiddenInput}
            type="file"
            accept="image/*"
            onChange={handleUploadInlineImage}
            disabled={!canEditFields}
          />
          <input
            ref={attachmentInputRef}
            className={styles.hiddenInput}
            type="file"
            multiple
            onChange={handleUploadAttachment}
            disabled={!canEditFields}
          />
          <div
            id="ticket-detail-editor"
            className={styles.editor}
            contentEditable={canEditFields}
            suppressContentEditableWarning
            onInput={(event) => {
              const html = event.currentTarget.innerHTML
              setForm((prev) => ({ ...prev, descriptionHtml: html }))
            }}
            dangerouslySetInnerHTML={{ __html: form.descriptionHtml || '<p></p>' }}
          />
          {form.attachments.length > 0 && (
            <ul className={styles.attachmentList}>
              {form.attachments.map((attachment, index) => (
                <li key={`${attachment.name}-${index}`} className={styles.attachmentItem}>
                  <a href={attachment.dataUrl} download={attachment.name}>
                    {attachment.name}
                  </a>
                  {canEditFields && (
                    <button
                      type="button"
                      className={styles.ghostButton}
                      onClick={() => removeAttachment(index)}
                    >
                      Remove
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </label>

        {canEditFields && (
          <div className={styles.actions}>
            <button className={styles.primaryButton} type="submit">
              Save Fields
            </button>
          </div>
        )}
      </form>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Comments</h2>
        <form className={styles.commentForm} onSubmit={handleAddComment}>
          <div className={styles.toolbarShell}>
            <div className={styles.toolbarLeft}>
              <div className={styles.toolbarGroup}>
                <button type="button" className={styles.ghostButton} onClick={() => runCommentCommand('bold')}>
                  <FiBold />
                </button>
                <button type="button" className={styles.ghostButton} onClick={() => runCommentCommand('italic')}>
                  <FiItalic />
                </button>
                <button type="button" className={styles.ghostButton} onClick={() => runCommentCommand('underline')}>
                  <FiUnderline />
                </button>
                <button type="button" className={styles.ghostButton} onClick={() => runCommentCommand('strikeThrough')}>
                  <span className={styles.toolbarGlyph}>S</span>
                </button>
              </div>
              <div className={styles.toolbarGroup}>
                <button type="button" className={styles.ghostButton} onClick={() => runCommentCommand('justifyLeft')}>
                  <FiAlignLeft />
                </button>
                <button type="button" className={styles.ghostButton} onClick={() => runCommentCommand('justifyCenter')}>
                  <FiAlignCenter />
                </button>
                <button type="button" className={styles.ghostButton} onClick={() => runCommentCommand('justifyRight')}>
                  <FiAlignRight />
                </button>
              </div>
              <div className={styles.toolbarGroup}>
                <button type="button" className={styles.ghostButton} onClick={() => runCommentCommand('insertOrderedList')}>
                  <span className={styles.toolbarGlyph}>1.</span>
                </button>
                <button type="button" className={styles.ghostButton} onClick={() => runCommentCommand('insertUnorderedList')}>
                  <FiList />
                </button>
              </div>
              <div className={styles.toolbarGroup}>
                <button type="button" className={styles.ghostButton} onClick={() => runCommentCommand('formatBlock', 'blockquote')}>
                  <span className={styles.toolbarGlyph}>""</span>
                </button>
                <button type="button" className={styles.ghostButton} onClick={() => runCommentCommand('formatBlock', 'pre')}>
                  <FiCode />
                </button>
              </div>
              <div className={styles.toolbarGroup}>
                <button
                  type="button"
                  className={styles.ghostButton}
                  onClick={() => {
                    const url = window.prompt('Enter image URL')
                    if (url) {
                      runCommentCommand('insertImage', url)
                    }
                  }}
                >
                  <FiImage />
                </button>
                <button type="button" className={styles.ghostButton} onClick={() => attachmentInputRef.current?.click()}>
                  <FiPaperclip />
                </button>
              </div>
              <div className={styles.toolbarGroup}>
                <FiType className={styles.toolbarIconMuted} />
                <select className={styles.input} onChange={(event) => handleCommentFontSizeChange(event.target.value)} defaultValue="normal">
                  <option value="small">Small</option>
                  <option value="normal">Normal</option>
                  <option value="large">Large</option>
                </select>
              </div>
            </div>
            <button className={styles.primaryButton} type="submit" disabled={!canAddComment}>
              Comment
            </button>
          </div>
          <div
            ref={commentEditorRef}
            className={styles.editor}
            contentEditable={canAddComment}
            suppressContentEditableWarning
            onInput={(event) => {
              const html = event.currentTarget.innerHTML
              setCommentHtml(html)
            }}
            data-placeholder="Write an update..."
          />
        </form>
      </section>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Activity Feed</h2>
        <ul className={styles.activityList}>
          {activities.map((activity) => (
            <li key={activity.id} className={styles.activityItem}>
              <div>
                <strong>{activity.type}</strong>
                {activity.message && <p className={styles.activityMessage}>{activity.message}</p>}
                {activity.html && (
                  <div
                    className={styles.activityHtml}
                    dangerouslySetInnerHTML={{ __html: activity.html }}
                  />
                )}
              </div>
              <div className={styles.activityMeta}>
                <span>{resolveUserName(activity.createdBy)}</span>
                <span>{formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}</span>
              </div>
            </li>
          ))}
          {activities.length === 0 && <li className={styles.subtle}>No activity yet.</li>}
        </ul>
      </section>
    </section>
  )
}
