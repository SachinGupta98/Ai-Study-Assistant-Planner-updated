
import React from 'react';
import { Curriculum } from '../types';
import { ACADEMIC_DATA } from '../constants';

interface TopicSelectorProps {
  curriculum: Curriculum;
  setCurriculum: (c: Curriculum) => void;
  subject: string;
  setSubject: (s: string) => void;
  disabled: boolean;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({ curriculum, setCurriculum, subject, setSubject, disabled }) => {
    const handleCurriculumChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCurriculum = e.target.value as Curriculum;
        setCurriculum(newCurriculum);
        setSubject(ACADEMIC_DATA[newCurriculum].subjects[0]);
    };
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="curriculum" className="block text-sm font-medium text-slate-300 mb-1">Curriculum</label>
                <select
                    id="curriculum"
                    value={curriculum}
                    onChange={handleCurriculumChange}
                    disabled={disabled}
                    className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                >
                    {Object.keys(ACADEMIC_DATA).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="subject" className="block text-sm font-medium text-slate-300 mb-1">Subject</label>
                <select
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    disabled={disabled}
                    className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                >
                    {ACADEMIC_DATA[curriculum].subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
        </div>
    );
};

export default TopicSelector;
