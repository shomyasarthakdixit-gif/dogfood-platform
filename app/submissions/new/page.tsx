'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import styles from './new-submission.module.css';
import type { Metadata } from 'next';

// ─── Validation ────────────────────────────────────────────────────────────
interface FormErrors {
  title?: string;
  description?: string;
  url?: string;
  form?: string;
}

function validateForm(data: {
  title: string;
  description: string;
  url: string;
}): FormErrors {
  const errors: FormErrors = {};
  if (!data.title.trim()) {
    errors.title = 'Project name is required.';
  } else if (data.title.trim().length > 255) {
    errors.title = 'Project name is too long (max 255 characters).';
  }
  if (data.description.length > 2000) {
    errors.description = 'Description is too long (max 2000 characters).';
  }
  if (data.url && data.url.trim()) {
    try {
      new URL(data.url.trim());
    } catch {
      errors.url = 'Please enter a valid URL (e.g., https://github.com/…).';
    }
  }
  return errors;
}

// ─── Form Component ────────────────────────────────────────────────────────
type SaveState = 'idle' | 'saving-draft' | 'submitting' | 'saved' | 'submitted' | 'error';

export default function NewSubmissionPage() {
  return (
    <Suspense fallback={<PageContainer size="md"><div>Loading...</div></PageContainer>}>
      <NewSubmissionForm />
    </Suspense>
  );
}

function NewSubmissionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId');
  const { addToast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const descChars = description.length;
  const MAX_DESC = 2000;

  function validate() {
    const errs = validateForm({ title, description, url });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function saveDraft() {
    if (!validate()) return;
    if (!eventId) {
      setErrors({ form: 'Missing event ID. Please start from the event page.' });
      setSaveState('error');
      return;
    }
    setSaveState('saving-draft');
    try {
      const res = await fetch(`/api/events/${eventId}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          url: url.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors({ form: data.error ?? 'Failed to save draft.' });
        setSaveState('error');
        return;
      }
      setSaveState('saved');
      addToast('Draft saved successfully.', 'success');
      router.push(`/submissions/${data.data.id}`);
    } catch {
      setErrors({ form: 'Something went wrong. Please try again.' });
      setSaveState('error');
    }
  }

  async function submitProject() {
    if (!validate()) return;
    if (!eventId) {
      setErrors({ form: 'Missing event ID. Please start from the event page.' });
      setSaveState('error');
      return;
    }
    setSaveState('submitting');
    try {
      // First create the submission as DRAFT, then immediately submit it
      const createRes = await fetch(`/api/events/${eventId}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          url: url.trim() || undefined,
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) {
        setErrors({ form: createData.error ?? 'Failed to create submission.' });
        setSaveState('error');
        return;
      }
      const submissionId = createData.data.id;
      const submitRes = await fetch(`/api/submissions/${submissionId}/submit`, {
        method: 'POST',
      });
      const submitData = await submitRes.json();
      if (!submitRes.ok) {
        setErrors({ form: submitData.error ?? 'Failed to submit project.' });
        setSaveState('error');
        return;
      }
      setSaveState('submitted');
      addToast('Project submitted successfully!', 'success');
      router.push(`/submissions/${submissionId}`);
    } catch {
      setErrors({ form: 'Something went wrong. Please try again.' });
      setSaveState('error');
    }
  }

  const isLoading = saveState === 'saving-draft' || saveState === 'submitting';

  return (
    <PageContainer size="md">
      <div className={styles.header}>
        <h1 className={styles.title}>Submit Your Project</h1>
        <p className={styles.subtitle}>
          Share what you&apos;ve built. You can save a draft first and come back to edit it.
        </p>
      </div>

      <Card shadow padding="lg">
        <form
          className={styles.form}
          onSubmit={e => { e.preventDefault(); saveDraft(); }}
          noValidate
          aria-label="New project submission"
        >
          <Input
            label="Project name"
            required
            placeholder="My Awesome Hackathon Project"
            value={title}
            onChange={e => { setTitle(e.target.value); setErrors(prev => ({ ...prev, title: undefined })); }}
            error={errors.title}
            disabled={isLoading}
            maxLength={255}
          />

          <div className={styles.textareaWrapper}>
            <Textarea
              label="Description"
              placeholder="Describe your project — what it does, how it works, what problem it solves…"
              rows={6}
              value={description}
              onChange={e => { setDescription(e.target.value); setErrors(prev => ({ ...prev, description: undefined })); }}
              error={errors.description}
              disabled={isLoading}
              maxLength={MAX_DESC}
              hint={`${descChars}/${MAX_DESC} characters`}
            />
          </div>

          <Input
            label="Repository URL"
            type="url"
            placeholder="https://github.com/yourname/your-project"
            value={url}
            onChange={e => { setUrl(e.target.value); setErrors(prev => ({ ...prev, url: undefined })); }}
            error={errors.url}
            disabled={isLoading}
            hint="Link to your GitHub, GitLab, or Bitbucket repository."
          />

          {errors.form && (
            <div className={styles.formError} role="alert">
              {errors.form}
            </div>
          )}

          <div className={styles.formActions}>
            <Button
              type="button"
              variant="secondary"
              size="md"
              loading={saveState === 'saving-draft'}
              disabled={isLoading}
              onClick={saveDraft}
            >
              {saveState === 'saved' ? '✓ Draft saved' : 'Save draft'}
            </Button>

            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={isLoading}
              onClick={() => {
                if (validateForm({ title, description, url }) && Object.keys(errors).length === 0) {
                  setConfirmSubmit(true);
                } else {
                  validate();
                }
              }}
            >
              Submit project
            </Button>
          </div>
        </form>
      </Card>

      {/* Confirm submit dialog */}
      {confirmSubmit && (
        <div
          className={styles.dialogOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          <Card shadow padding="lg" className={styles.dialog}>
            <h2 id="confirm-title" className={styles.dialogTitle}>
              Ready to submit?
            </h2>
            <p className={styles.dialogBody}>
              Once submitted, your project will be officially entered into the hackathon.
              You may not be able to edit it after submission.
            </p>
            <div className={styles.dialogActions}>
              <Button
                variant="secondary"
                onClick={() => setConfirmSubmit(false)}
                disabled={saveState === 'submitting'}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={saveState === 'submitting'}
                onClick={() => { setConfirmSubmit(false); submitProject(); }}
              >
                Submit project
              </Button>
            </div>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
