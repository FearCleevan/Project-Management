import { useEffect, useMemo, useRef, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
  FiAlignCenter,
  FiAlignLeft,
  FiAlignRight,
  FiBold,
  FiCircle,
  FiCode,
  FiImage,
  FiItalic,
  FiList,
  FiPaperclip,
  FiUnderline,
  FiX,
} from 'react-icons/fi'
import { toast } from 'react-toastify'
import styles from './ProjectBoardPage.module.css'
import { useAuthStore } from '../stores/authStore'
import { useProjectsStore } from '../stores/projectsStore'
import { useUsersStore } from '../stores/usersStore'
import { useWorkItemsStore } from '../stores/workItemsStore'
import { canComment, canEditTicket, canMoveTicket } from '../utils/permissions'

export default function ProjectBoardPage() {
  const { projectId } = useParams()
  const currentUser = useAuthStore((state) => state.currentUser)
  const users = useUsersStore((state) => state.listUsers())
  const loadProjects = useProjectsStore((state) => state.loadProjects)
  const getProjectForUser = useProjectsStore((state) => state.getProjectForUser)
  const items = useWorkItemsStore((state) => state.items)
  const loadByProject = useWorkItemsStore((state) => state.loadByProject)
  const updateWorkItem = useWorkItemsStore((state) => state.update)
  const moveStatus = useWorkItemsStore((state) => state.moveStatus)
  const addComment = useWorkItemsStore((state) => state.addComment)
  const [selectedId, setSelectedId] = useState(null)
  const [commentHtml, setCommentHtml] = useState('')
  const commentEditorRef = useRef(null)

  useEffect(() => {
    loadProjects()
    if (projectId) {
      loadByProject(projectId)
    }
  }, [loadByProject, loadProjects, projectId])

  const project = useMemo(
    () => getProjectForUser(projectId, currentUser?.id),
    [currentUser?.id, getProjectForUser, projectId],
  )

  const projectItems = useMemo(
    () => items.filter((item) => item.projectId === projectId),
    [items, projectId],
  )

  useEffect(() => {
    if (!selectedId && projectItems.length > 0) {
      setSelectedId(projectItems[0].id)
    }
    if (selectedId && !projectItems.some((item) => item.id === selectedId)) {
      setSelectedId(projectItems[0]?.id || null)
    }
  }, [projectItems, selectedId])

  const selectedItem = useMemo(
    () => projectItems.find((item) => item.id === selectedId) || null,
    [projectItems, selectedId],
  )

  if (!project) {
    return <h1>Project Board - Project not found or not accessible</h1>
  }

  const statesOrder = ['Backlog', 'Todo', 'In Progress', 'In Review', 'Done']
  const grouped = statesOrder.map((state) => ({
    state,
    items: projectItems.filter((item) => item.state === state),
  })).filter((group) => group.items.length > 0)

  const canMove = canMoveTicket(currentUser)
  const canEdit = canEditTicket(currentUser)
  const canAddComment = canComment(currentUser)

  function resolveUser(userId) {
    return users.find((user) => user.id === userId)?.name || 'Unassigned'
  }

  function handleMoveStatus(workItemId, newState) {
    try {
      moveStatus({
        actor: currentUser,
        workItemId,
        newState,
      })
      toast.success('Status updated.')
    } catch (error) {
      toast.error(error.message || 'Unable to move status.')
    }
  }

  function handlePriorityChange(workItemId, priority) {
    try {
      updateWorkItem({
        actor: currentUser,
        workItemId,
        patch: { priority },
      })
      toast.success('Priority updated.')
    } catch (error) {
      toast.error(error.message || 'Unable to update priority.')
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

  function handleCommentSubmit(event) {
    event.preventDefault()
    if (!selectedItem) {
      return
    }

    const plain = commentHtml.replace(/<[^>]+>/g, '').trim()
    if (!plain) {
      toast.error('Comment cannot be empty.')
      return
    }

    try {
      addComment({
        actor: currentUser,
        workItemId: selectedItem.id,
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

  return (
    <section className={styles.page}>
      <div className={styles.listPane}>
        <header className={styles.header}>
          <h1>{`${project.name} / Work Items`}</h1>
          <span>{projectItems.length}</span>
        </header>

        {grouped.length === 0 && (
          <div className={styles.empty}>
            <p>No tickets yet. Create one from the topbar "New Ticket".</p>
          </div>
        )}

        {grouped.map((group) => (
          <section key={group.state} className={styles.group}>
            <div className={styles.groupHeader}>
              <h2>{group.state}</h2>
              <span>{group.items.length}</span>
            </div>
            <ul className={styles.rows}>
              {group.items.map((item) => (
                <li
                  key={item.id}
                  className={`${styles.row} ${selectedId === item.id ? styles.rowActive : ''}`}
                  onClick={() => setSelectedId(item.id)}
                >
                  <span className={styles.rowId}>{item.id}</span>
                  <span className={styles.rowTitle}>{item.title}</span>
                  <span className={styles.rowMeta}>{item.priority}</span>
                  <span className={styles.rowMeta}>{resolveUser(item.assigneeId)}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <aside className={styles.detailPane}>
        {!selectedItem ? (
          <div className={styles.empty}>
            <p>Select a work item from the list.</p>
          </div>
        ) : (
          <>
            <div className={styles.detailHeader}>
              <h3>{selectedItem.title}</h3>
              <button type="button" className={styles.iconButton} onClick={() => setSelectedId(null)}>
                <FiX />
              </button>
            </div>

            <div className={styles.properties}>
              <label className={styles.property}>
                <span>State</span>
                <select
                  className={styles.input}
                  value={selectedItem.state}
                  onChange={(event) => handleMoveStatus(selectedItem.id, event.target.value)}
                  disabled={!canMove}
                >
                  {statesOrder.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.property}>
                <span>Priority</span>
                <select
                  className={styles.input}
                  value={selectedItem.priority}
                  onChange={(event) => handlePriorityChange(selectedItem.id, event.target.value)}
                  disabled={!canEdit}
                >
                  <option value="NONE">NONE</option>
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="URGENT">URGENT</option>
                </select>
              </label>

              <div className={styles.property}>
                <span>Assignee</span>
                <strong>{resolveUser(selectedItem.assigneeId)}</strong>
              </div>
            </div>

            <div className={styles.section}>
              <h4>Description</h4>
              <div
                className={styles.description}
                dangerouslySetInnerHTML={{ __html: selectedItem.descriptionHtml || '<p>No description yet.</p>' }}
              />
            </div>

            <div className={styles.section}>
              <h4>Activity</h4>
              <ul className={styles.activity}>
                {(selectedItem.activities || [])
                  .slice()
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((activity) => (
                    <li key={activity.id}>
                      <strong>{activity.type}</strong>
                      {activity.message && <p>{activity.message}</p>}
                      {activity.html && <div dangerouslySetInnerHTML={{ __html: activity.html }} />}
                      <span>{`${resolveUser(activity.createdBy)} • ${formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}`}</span>
                    </li>
                  ))}
              </ul>
            </div>

            <form className={styles.commentBox} onSubmit={handleCommentSubmit}>
              <div className={styles.toolbarShell}>
                <div className={styles.toolbarLeft}>
                  <button type="button" className={styles.iconButton} onClick={() => runCommentCommand('bold')}>
                    <FiBold />
                  </button>
                  <button type="button" className={styles.iconButton} onClick={() => runCommentCommand('italic')}>
                    <FiItalic />
                  </button>
                  <button type="button" className={styles.iconButton} onClick={() => runCommentCommand('underline')}>
                    <FiUnderline />
                  </button>
                  <button type="button" className={styles.iconButton} onClick={() => runCommentCommand('strikeThrough')}>
                    <FiCircle />
                  </button>
                  <button type="button" className={styles.iconButton} onClick={() => runCommentCommand('justifyLeft')}>
                    <FiAlignLeft />
                  </button>
                  <button type="button" className={styles.iconButton} onClick={() => runCommentCommand('justifyCenter')}>
                    <FiAlignCenter />
                  </button>
                  <button type="button" className={styles.iconButton} onClick={() => runCommentCommand('justifyRight')}>
                    <FiAlignRight />
                  </button>
                  <button type="button" className={styles.iconButton} onClick={() => runCommentCommand('insertOrderedList')}>
                    1.
                  </button>
                  <button type="button" className={styles.iconButton} onClick={() => runCommentCommand('insertUnorderedList')}>
                    <FiList />
                  </button>
                  <button type="button" className={styles.iconButton} onClick={() => runCommentCommand('formatBlock', 'pre')}>
                    <FiCode />
                  </button>
                  <button
                    type="button"
                    className={styles.iconButton}
                    onClick={() => {
                      const url = window.prompt('Enter image URL')
                      if (url) {
                        runCommentCommand('insertImage', url)
                      }
                    }}
                  >
                    <FiImage />
                  </button>
                  <button type="button" className={styles.iconButton}>
                    <FiPaperclip />
                  </button>
                </div>
                <button className={styles.primaryButton} type="submit">
                  Comment
                </button>
              </div>
              <div
                ref={commentEditorRef}
                className={styles.commentEditor}
                contentEditable={canAddComment}
                suppressContentEditableWarning
                onInput={(event) => setCommentHtml(event.currentTarget.innerHTML)}
                data-placeholder="Add comment"
              />
            </form>
          </>
        )}
      </aside>
    </section>
  )
}
